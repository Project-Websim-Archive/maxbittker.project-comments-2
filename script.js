async function getCurrentProject() {
  const project = await window.websim.getCurrentProject();
  return project.id;
}

async function fetchComments(projectId) {
  const response = await fetch(`/api/v1/projects/${projectId}/comments`);
  const data = await response.json();
  return data.comments;
}

function createAvatarElement(username) {
  const avatar = document.createElement('img');
  avatar.className = 'floating-avatar';
  avatar.src = `https://images.websim.ai/avatar/${username}`;
  avatar.alt = username;
  avatar.title = `@${username}`;
  
  const link = document.createElement('a');
  link.href = `https://websim.ai/@${username}`;
  link.appendChild(avatar);
  
  return link;
}

async function updateCommenters(projectId, avatarSpace) {
  const comments = await fetchComments(projectId);
  avatarSpace.innerHTML = ''; // Clear existing avatars
  
  // Sort comments by creation date (oldest first)
  const sortedComments = comments.data.sort((a, b) => 
    new Date(a.comment.created_at) - new Date(b.comment.created_at)
  );
  
  // Create array of unique commenters (keeping first occurrence/oldest comment)
  const uniqueCommenters = Array.from(
    new Map(
      sortedComments
        .filter(({comment}) => comment.author && comment.author.username)
        .map(({comment}) => [comment.author.username, comment.author])
    ).values()
  );
  
  // Add commenters in order
  uniqueCommenters.forEach(author => {
    const avatarLink = createAvatarElement(author.username);
    avatarSpace.appendChild(avatarLink);
  });
}

async function init() {
  try {
    const projectId = await getCurrentProject();
    const avatarSpace = document.getElementById('avatar-space');
    
    // Initial load
    await updateCommenters(projectId, avatarSpace);
    
    // Poll for new comments every 3 seconds
    setInterval(() => {
      updateCommenters(projectId, avatarSpace);
    }, 3000);
    
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
}

init();