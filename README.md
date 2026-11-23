# Milestone Set action

The purpose of this action is to set the Milestone of a merged Pull Request. The Milestone is automatically selected 
to the next open and due date Milestone.  

The action runs on `push` events: it finds the merged Pull Request that produced the pushed commit and sets its 
Milestone. Commits pushed without a Pull Request are skipped.

## Inputs

### `github-token`

**Required** The GitHub Token used to create an authenticated client. The Github Token is already set by the Github
Action itself. Use this if you want to pass in your own Personal Access Token.

**Default** `${{github.token}}`.

## Example usage

Set up the Action:

```yaml
name: Update Milestone

on:
  push:
    branches:
      - main

permissions:
  issues: write
  pull-requests: write

jobs:
  update:
    runs-on: ubuntu-latest
    name: update-milestone

    steps:
      - uses: smallrye/milestone-set-action@main
        name: milestone set
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
```
