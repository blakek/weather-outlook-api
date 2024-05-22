# Weather Outlook API

> ⛈️ A weather API built on the [NWS](http://www.weather.gov/) and
> [Storm Prediction Center](https://www.spc.noaa.gov/) that provides the
> categorical, tornado, hail, wind, etc. outlooks for a location.

This fills a gap until the NWS provides a public API for SPC outlooks for a
location. This API just downloads the outlook GeoJSON files and uses them to
provide the outlooks for a location.

## Getting Started

[Bun] is required to run this project.

To install dependencies, run:

```bash
bun install
```

To run the project, run:

```bash
bun start
```

To run the tests, run:

```bash
bun test
```

See below for other scripts.

### Useful Commands

|                     |                                                 |
| ------------------- | ----------------------------------------------- |
| `yarn build`        | Builds the project to `./dist`                  |
| `yarn format`       | Format the source following the Prettier styles |
| `yarn test`         | Run project tests                               |
| `yarn test --watch` | Run project tests, watching for file changes    |

## License

MIT

[bun]: https://bun.sh/
