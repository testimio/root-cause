# Failure suggestions telemetry

As part of an incubating feature, we are collection some basic telemetry & usage statistics.

We don't collect any personal/business data nor information about the application under test or the test code itself.

The data we collect per root cause execution:

- Operating system name (windows/linux/darwin)
- uid - randomly generated local project identifier
- artifacts: count of Root Cause artifacts generated during test run (eg: screenshots)
- age: Project install time
- Crashes: number of failed tests

## Opt-out

It's possible to out-out from the telemetry collection by setting an environment variable: `SUGGESTIONS_OPT_OUT`
