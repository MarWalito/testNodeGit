const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

async function getFileContentFromRepo({ owner, repo, path, branch, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3.raw'
      },
      responseType: 'text'
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching file from source repo:', error);
    throw error;
  }
}

async function pushFileToRepo({ owner, repo, path, branch, message, content, token }) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  try {
    // Step 1: Get the SHA of the reference (branch)
    const refResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const latestCommitSha = refResponse.data.object.sha;
    // Step 2: Get the tree SHA of the latest commit
    const commitResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const baseTreeSha = commitResponse.data.tree.sha;
    // Step 3: Create a blob for the new file content
    const blobResponse = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
      {
        content: Buffer.from(content).toString('base64'),
        encoding: 'base64',
      },
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const newBlobSha = blobResponse.data.sha;
    // Step 4: Create a new tree including the new file
    const treeResponse = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        base_tree: baseTreeSha,
        tree: [
          {
            path: path,
            mode: '100644',
            type: 'blob',
            sha: newBlobSha,
          },
        ],
      },
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const newTreeSha = treeResponse.data.sha;
    // Step 5: Create a new commit with the new tree
    const commitResponse2 = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        message: message,
        tree: newTreeSha,
        parents: [latestCommitSha],
      },
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const newCommitSha = commitResponse2.data.sha;
    // Step 6: Update the reference to point to the new commit
    await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        sha: newCommitSha,
      },
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    console.log('File pushed successfully');
  } catch (error) {
    console.error('Error pushing file:', error);
    throw error;
  }
}

async function transferFile({
  sourceOwner,
  sourceRepo,
  sourcePath,
  sourceBranch,
  sourceToken,
  destOwner,
  destRepo,
  destPath,
  destBranch,
  destMessage,
  destToken
}) {
  try {
    const content = await getFileContentFromRepo({
      owner: sourceOwner,
      repo: sourceRepo,
      path: sourcePath,
      branch: sourceBranch,
      token: sourceToken
    });
    await pushFileToRepo({
      owner: destOwner,
      repo: destRepo,
      path: destPath,
      branch: destBranch,
      message: destMessage,
      content,
      token: destToken
    });
    return { message: 'File transferred successfully' };
  } catch (error) {
    console.error('Error transferring file:', error);
    return { message: 'Error transferring file' };
  }
}

app.post('/push-csv', async (req, res) => {
  const result = await transferFile({
    sourceOwner: 'MarWalito', // Remplacez par le propriétaire du dépôt source
    sourceRepo: 'auto_deploy_v0.3', // Nom du dépôt source
    sourcePath: 'environment.csv', // Chemin du fichier dans le dépôt source
    sourceBranch: 'main', // Branche du dépôt source
    sourceToken: 'YOUR_SOURCE_GITHUB_TOKEN', // Token GitHub pour le dépôt source
    destOwner: 'your-dest-owner', // Remplacez par le propriétaire du dépôt de destination
    destRepo: 'version', // Nom du dépôt de destination
    destPath: 'environment.csv', // Chemin du fichier dans le dépôt de destination
    destBranch: 'main', // Branche du dépôt de destination
    destMessage: 'Update environment.csv', // Message de commit pour le dépôt de destination
    destToken: 'YOUR_DEST_GITHUB_TOKEN' // Token GitHub pour le dépôt de destination
  });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});