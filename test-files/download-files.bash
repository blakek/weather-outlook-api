#!/usr/bin/env bash

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

curl --output-dir "$__dir" -LO 'https://www.spc.noaa.gov/products/outlook/archive/2021/day1otlk_20210325_1630_cat.lyr.geojson'
curl --output-dir "$__dir" -LO 'https://www.spc.noaa.gov/products/outlook/archive/2021/day1otlk_20210325_1630_{,sig}{wind,hail,torn}.lyr.geojson'
