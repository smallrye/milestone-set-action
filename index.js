const core = require('@actions/core');
const github = require('@actions/github');

try {
    const token = core.getInput('github-token')
    const ghOwner = github.context.repo.owner;
    const ghRepo = github.context.repo.repo;
    const sha = github.context.sha;
    let pullRequestNumber = github.context.payload.pull_request?.number

    const octokit = github.getOctokit(token);
    // On push events, find the merged Pull Request that produced the pushed commit
    const pullRequest = pullRequestNumber
        ? Promise.resolve(pullRequestNumber)
        : octokit.rest.repos.listPullRequestsAssociatedWithCommit({
            owner: ghOwner,
            repo: ghRepo,
            commit_sha: sha,
        }).then(({data}) => data.find(pr => pr.merged_at && pr.merge_commit_sha === sha)?.number);

    pullRequest.then(number => {
        if (number == null) {
            return null;
        }
        pullRequestNumber = number;
        console.log(`Pull Request Number ${pullRequestNumber}`);
        return octokit.rest.issues.listMilestones({
            owner: ghOwner,
            repo: ghRepo,
            state: 'open',
            sort: 'due_on',
            direction: 'asc',
        });
    }).then((response) => {
        if (response == null) {
            console.log(`No merged Pull Request found for commit ${sha}`);
            return;
        }
        const data = response.data;

        let milestone = data.shift();
        let first = milestone;

        while (milestone && milestone.due_on === null) {
            milestone = data.shift();
        }

        if (milestone == null && first !== null) {
            console.log(`No Milestones with due date found, falling back to first Milestone!`);
            milestone = first;
        }

        if (milestone == null) {
            console.log(`No Milestones found!`);
            return;
        }

        console.log(`Found Milestone ${milestone.title}`);

        octokit.rest.issues.get({
            owner: ghOwner,
            repo: ghRepo,
            issue_number: pullRequestNumber,
        }).then(issue => {
            if (issue.data.milestone != null) {
                console.log(`Pull Request ${pullRequestNumber} already has the Milestone set to ${issue.data.milestone.title}`);
                return;
            }

            console.log(`Setting Milestone ${milestone.title} to Pull Request ${pullRequestNumber}`);

            octokit.rest.issues.update({
                owner: ghOwner,
                repo: ghRepo,
                issue_number: pullRequestNumber,
                milestone: milestone.number
            })
        });

    }).catch((error) => {
        console.debug(error);
        core.setFailed('Unknown Error!')
    })

} catch (error) {
    core.setFailed(error.message);
}
