# Contributing

Thanks for choosing to contribute!

The following are a set of guidelines to follow when contributing to this project.

## Code Of Conduct

This project adheres to the Adobe [code of conduct](./CODE_OF_CONDUCT.md). By participating,
you are expected to uphold this code. Please report unacceptable behavior to
[Grp-opensourceoffice@adobe.com](mailto:Grp-opensourceoffice@adobe.com).

## Reporting issues

### Bugs

We use [GitHub issues](https://github.com/adobe/react-spectrum-charts/issues) to track work and log bugs. Please check existing issues before filing anything new. We do our best to respond to issues within a few days. If you would like to contribute a fix, please let us know by leaving a comment on the issue.

The best way to reduce back and forth on a bug is provide a small code example exhibiting the issue along with steps to reproduce it. If you would like to work on a bugfix yourself, make sure an issue exists first.

Please follow the issue templates when filing new ones and add as much information as possible.

### Feature Requests

If you have a feature request, you can use our Feature Request issue template. For larger scopes of work, it is a good idea to open a Request For Comments (RFC) first to gather feedback from the team. Please follow our [RFC template](./rfcs/template.md). Make a PR to add your RFC to the [rfcs folder](./rfcs/) to give the team and the community a chance to discuss the proposal.

### Security Issues

Security issues shouldn't be reported on this issue tracker. Instead, [file an issue to our security experts](https://helpx.adobe.com/security/alertus.html).

## Pull Requests

For significant changes, it is recommended that you first propose your solution in an [RFC](#feature-requests) and gather feedback.

A few things to keep in mind before submitting a pull request:

-   Add a clear description covering your changes
-   Reference the issue in the description
-   Make sure linting and tests pass
-   Include relevant unit tests
-   Add/update stories in storybook for your changes
    -   Any change that adds or modifies a prop must have stories to represent that change and tests written that validate the new behavior
-   Update documentation
-   Remember that all submissions require review, please be patient.

The team will review all pull requests and do one of the following:

-   request changes to it (most common)
-   merge it
-   close it with an explanation.

Read GitHub's [pull request documentation](https://help.github.com/articles/about-pull-requests/) for more information on sending pull requests.

Lastly, please follow the pull request template when submitting a pull request!

### Contributor License Agreement

All third-party contributions to this project must be accompanied by a signed contributor
license agreement. This gives Adobe permission to redistribute your contributions
as part of the project. [Sign our CLA](https://opensource.adobe.com/cla.html). You
only need to submit an Adobe CLA one time, so if you have submitted one previously,
you are good to go!

## Where to start

There are many places to dive into react-spectrum-charts to help out. Before you take on a feature or issue, make sure you become familiar with our developer [best practices](https://github.com/adobe/react-spectrum-charts/wiki/Developer-Docs#best-practices) and overview of [how `react-spectrum-charts` works](https://github.com/adobe/react-spectrum-charts/wiki/Developer-Docs#how-it-works).

If you are looking for place to start, consider the following options:

-   Look for issues tagged with help wanted and/or good first issue.
-   Help triage existing issues by investigating problems and following up on missing information.
-   Update missing or fix existing documentation
-   Review and test open pull requests

## Developing

When you are ready to start developing you can clone the repo and start storybook. Make sure you have the following requirements installed: [node](https://nodejs.org/) (v14.15.0+) and [yarn](https://yarnpkg.com/en/) (v1.22.0+)

Fork the repo first using [this guide](https://help.github.com/articles/fork-a-repo), then clone it locally.

```
git clone https://github.com/YOUR-USERNAME/react-spectrum-charts
cd react-spectrum-charts
yarn install
```

You can then run the storybook and browse to http://localhost:6009 with:

```
yarn start
```

or

```
yarn storybook
```

### Tests

We use jest for unit tests and react-testing-library for rendering and writing assertions. Please make sure you include tests with your pull requests. Our CI will run the tests on PRs as well as the linter and type checker. We use SonarCloud as a quality gate for all new code. All new code in your PR must have test coverage of 90% or higher to pass the build.

We recommend testing two main things.

1. Test the spec output to ensure that the Vega spec produced is what expect based on your changes
2. Test stories to ensure that what has been rendered looks and interacts as you would expect based on your changes

If you are curious about the best way to write a test for an interaction or to validate a spec, start by referencing existing tests that check similar things.

To run all tests once, run:

```
yarn test
```

or to coninually run tests when files update, run:

```
yarn watch
```

### Linting

The code is linted with eslint.

```
yarn lint
```

### Storybook

We use Storybook for local development. Run the following command to start it:

```
yarn start
```

This should automatically open http://localhost:6009 in your browser when it finishes building, or you can navigate there manually.

Each new feature should have dedicated stories added to storybook to demonstrate that feature as well as tests on those stories that validate the feature.

## From Contributor To Committer

We love contributions from our community! If you'd like to go a step beyond contributor and become a committer with full write access and a say in the project, you must be invited to the project. The existing committers employ an internal nomination process that must reach lazy consensus (silence is approval) before invitations are issued. If you feel you are qualified and want to get more deeply involved, feel free to reach out to existing committers to have a conversation about that.
