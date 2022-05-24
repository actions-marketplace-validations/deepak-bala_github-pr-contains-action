import * as core from "@actions/core";
const { GitHub, context } = require("@actions/github");
const parse = require("parse-diff");

async function run() {
  try {
    // get information on everything
    const token = core.getInput("github-token", { required: true });
    const github = new GitHub(token, {});

    // Check if the body contains banned strings
    const additionDoesNotContain = core.getInput("additionDoesNotContain");

    if (additionDoesNotContain) 
    {
      if (!context.payload.pull_request.body) 
      {
        core.setFailed("The body of the PR is empty, can't check");
      } 
      else 
      {
        if (additionDoesNotContain && context.payload.pull_request.body.indexOf(additionDoesNotContain) >= 0)
          {
            core.setFailed(
              "The body of the PR should not contain " + additionDoesNotContain
            );
        }
      }
    }

    
    const diff_url = context.payload.pull_request.diff_url;
    const result = await github.request(diff_url);
    const files = parse(result.data);
    core.exportVariable("files", files);
    core.setOutput("files", files);
    const filesChangedMaximum = +core.getInput("filesChangedMaximum");
    if (filesChangedMaximum && files.length > filesChangedMaximum) 
    {
      core.setFailed("You cannot submit a PR that changes more than " + filesChangedMaximum + " file(s)");
    }

    var changes = "";
    var additions: number = 0;
    files.forEach(function (file) {
      additions += file.additions;
      file.chunks.forEach(function (chunk) {
        chunk.changes.forEach(function (change) {
          if (change.add) {
            changes += change.content;
          }
        });
      });
    });

    if (additionDoesNotContain)
    {
        var word_arr = additionDoesNotContain.split(";");
        word_arr.forEach( (item) => 
        {
          if(context.payload.pull_request.body.indexOf(additionDoesNotContain) >= 0)
          {
            core.setFailed("The body of the PR should not contain " + item);
          }
        })
    }
    core.exportVariable("diff", changes);
    core.setOutput("diff", changes);

    const linesChangedMaximum = +core.getInput("linesChangedMaximum");
    if (linesChangedMaximum && additions > linesChangedMaximum) {
      const this_msg =
        "Cannot submit a PR whose additions include more than " +
        linesChangedMaximum +
        " lines(s). You have changed " +
        additions;
      core.setFailed(this_msg);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
