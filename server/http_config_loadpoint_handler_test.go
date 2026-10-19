package server

import (
	"bytes"
	"encoding/json"
	"maps"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/evcc-io/evcc/core"
	"github.com/evcc-io/evcc/core/loadpoint"
	coresettings "github.com/evcc-io/evcc/core/settings"
	"github.com/evcc-io/evcc/db"
	"github.com/evcc-io/evcc/util"
	"github.com/evcc-io/evcc/util/config"
	"github.com/evcc-io/evcc/util/templates"
	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestLoadpointConfigDisabledNilInstance ensures loadpointConfig does not panic
// for a disabled loadpoint whose instance was never created (nil loadpoint.API).
func TestLoadpointConfigDisabledNilInstance(t *testing.T) {
	conf := config.Config{
		Class:      templates.Loadpoint,
		Properties: config.Properties{Disable: true},
		Data: map[string]any{
			"charger": "wallbox",
			"meter":   "lp-meter",
			"title":   "Garage",
			"mode":    "pv", // runtime setting persisted by the settings adapter
		},
	}

	var instance loadpoint.API // nil: disabled loadpoint has no live instance
	dev := config.NewConfigurableDevice(&conf, instance)

	var res loadpointFullConfig
	require.NotPanics(t, func() {
		var err error
		res, err = loadpointConfig(dev)
		require.NoError(t, err)
	})

	assert.True(t, res.Disable)
	assert.Equal(t, "wallbox", res.Charger)
	assert.Equal(t, "lp-meter", res.Meter)
}

// TestDeleteLoadpointDisabledNilInstance ensures deleteLoadpointHandler does not
// dereference a nil instance when deleting a disabled loadpoint.
func TestDeleteLoadpointDisabledNilInstance(t *testing.T) {
	require.NoError(t, db.NewInstance("sqlite", ":memory:"))

	conf, err := config.AddConfig(templates.Loadpoint,
		map[string]any{"charger": "wallbox", "title": "Garage"},
		config.WithProperties(config.Properties{Disable: true}),
	)
	require.NoError(t, err)

	var instance loadpoint.API // nil: disabled loadpoint has no live instance
	dev := config.NewConfigurableDevice(&conf, instance)
	require.NoError(t, config.Loadpoints().Add(dev))
	t.Cleanup(func() { _ = config.Loadpoints().Delete(config.NameForID(conf.ID)) })

	req := httptest.NewRequest(http.MethodDelete, "/", nil)
	req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(conf.ID)})
	rec := httptest.NewRecorder()

	require.NotPanics(t, func() {
		deleteLoadpointHandler()(rec, req)
	})
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestUpdateLoadpointCircuit(t *testing.T) {
	for _, active := range []bool{false, true} {
		name := "nil instance"
		if active {
			name = "active instance"
		}
		t.Run(name, func(t *testing.T) {
			require.NoError(t, db.NewInstance("sqlite", ":memory:"))
			conf, err := config.AddConfig(templates.Loadpoint, map[string]any{
				"charger": "wallbox", "meter": "lp-meter", "vehicle": "car",
				"title": "Garage", "priority": 3, "minCurrent": 8.0,
				"maxCurrent": 12.0, "defaultMode": "off", "phasesConfigured": 3,
				"circuit": "home", "mode": "smart", "minSoc": 35,
			}, config.WithProperties(config.Properties{Disable: !active, Title: "Device title"}))
			require.NoError(t, err)

			var instance loadpoint.API
			if active {
				log := util.NewLogger("test")
				lp := core.NewLoadpoint(log, coresettings.NewConfigSettingsAdapter(log, &conf))
				lp.ChargerRef, lp.MeterRef, lp.VehicleRef, lp.CircuitRef = "wallbox", "lp-meter", "car", "home"
				dynamic, _, err := loadpoint.SplitConfig(conf.Named().Other)
				require.NoError(t, err)
				require.NoError(t, dynamic.Apply(lp))
				instance = lp
			}
			dev := config.NewConfigurableDevice(&conf, instance)
			require.NoError(t, config.Loadpoints().Add(dev))
			t.Cleanup(func() { _ = config.Loadpoints().Delete(config.NameForID(conf.ID)) })

			handler := updateLoadpointHandler()
			cases := []struct {
				name    string
				payload map[string]any
				circuit string
				title   string
			}{
				{"assign", map[string]any{"circuit": "garage"}, "garage", "Garage"},
				{"omit circuit", map[string]any{"title": "Carport"}, "garage", "Carport"},
				{"remove null", map[string]any{"circuit": nil}, "", "Carport"},
				{"omit removed circuit", map[string]any{"title": "Garage"}, "", "Garage"},
				{"reassign", map[string]any{"circuit": "home"}, "home", "Garage"},
				{"remove empty string", map[string]any{"circuit": ""}, "", "Garage"},
			}
			for _, tc := range cases {
				t.Run(tc.name, func(t *testing.T) {
					before, err := config.ConfigByID(conf.ID)
					require.NoError(t, err)
					want := maps.Clone(before.Data)
					want["title"] = tc.title
					if tc.circuit == "" {
						delete(want, "circuit")
					} else {
						want["circuit"] = tc.circuit
					}

					body, err := json.Marshal(tc.payload)
					require.NoError(t, err)
					req := httptest.NewRequest(http.MethodPut, "/", bytes.NewReader(body))
					req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(conf.ID)})
					rec := httptest.NewRecorder()
					handler(rec, req)
					require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())

					persisted, err := config.ConfigByID(conf.ID)
					require.NoError(t, err)
					assert.Equal(t, want, persisted.Data, "unrelated persisted fields must not change")
					assert.Equal(t, before.Properties, persisted.Properties)
					if active {
						assert.Equal(t, "home", instance.GetCircuitRef(), "static changes require a restart")
						assert.Equal(t, tc.title, instance.GetTitle())
						assert.Equal(t, 3, instance.GetPriority())
						assert.Equal(t, 35, instance.GetMinSoc())
					}
				})
			}
		})
	}
}
