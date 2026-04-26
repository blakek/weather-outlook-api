#!/usr/bin/env bash

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

curl --output-dir "$__dir" -LO 'https://www.spc.noaa.gov/products/outlook/archive/2026/day1otlk_20260315_1630_{cat,wind,hail,torn}.lyr.geojson'
