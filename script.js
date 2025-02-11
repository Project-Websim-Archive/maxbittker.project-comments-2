async function getCurrentProject() {
  const project = await window.websim.getCurrentProject();
  return project.id;
}

async function fetchComments(projectId) {
  const response = await fetch(`/api/v1/projects/${projectId}/comments`);
  const data = await response.json();
  return data.comments;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function createFloatingAvatar(username, index, total) {
  const avatar = document.createElement('img');
  avatar.className = 'floating-avatar';
  avatar.src = `https://images.websim.ai/avatar/${username}`;
  avatar.alt = username;
  avatar.title = `@${username}`;
  
  // Make it a link
  const link = document.createElement('a');
  link.href = `https://websim.ai/@${username}`;
  link.appendChild(avatar);
  
  // Random starting position
  link.style.left = `${getRandomFloat(10, 90)}%`;
  link.style.top = `${getRandomFloat(10, 90)}%`;
  
  // Set random drift properties
  const xDrift = getRandomFloat(-200, 200);
  const yDrift = getRandomFloat(-200, 200);
  const rotation = getRandomFloat(-45, 45);
  const duration = getRandomFloat(15, 25);
  
  link.style.setProperty('--x-drift', `${xDrift}px`);
  link.style.setProperty('--y-drift', `${yDrift}px`);
  link.style.setProperty('--rotation', `${rotation}deg`);
  
  link.style.animation = `float ${duration}s infinite ease-in-out`;
  // Add slight delay to each avatar's animation
  link.style.animationDelay = `${(index * 1.5) % 5}s`;
  
  return link;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function createCommentElement(comment) {
  const div = document.createElement('div');
  div.className = 'comment';
  
  const header = document.createElement('div');
  header.className = 'comment-header';
  
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.src = `https://images.websim.ai/avatar/${comment.author.username}`;
  avatar.alt = comment.author.username;
  
  const userLink = document.createElement('a');
  userLink.className = 'username';
  userLink.href = `https://websim.ai/@${comment.author.username}`;
  userLink.textContent = `@${comment.author.username}`;
  
  const timestamp = document.createElement('span');
  timestamp.className = 'timestamp';
  timestamp.textContent = formatTimestamp(comment.created_at);
  
  header.appendChild(avatar);
  header.appendChild(userLink);
  header.appendChild(timestamp);
  
  const content = document.createElement('div');
  content.className = 'comment-content';
  
  // Handle document node content
  if (comment.content && comment.content.children) {
    comment.content.children.forEach(child => {
      if (child.type === 'paragraph') {
        const p = document.createElement('p');
        child.children.forEach(textNode => {
          if (textNode.type === 'text') {
            p.textContent += textNode.text;
          }
        });
        content.appendChild(p);
      }
    });
  }
  
  div.appendChild(header);
  div.appendChild(content);
  
  if (comment.reply_count > 0) {
    const replies = document.createElement('div');
    replies.className = 'replies';
    div.appendChild(replies);
  }
  
  return div;
}

async function updateCommenters(projectId, avatarSpace) {
  const comments = await fetchComments(projectId);
  const currentAvatars = new Set([...avatarSpace.children].map(link => link.querySelector('img').alt));
  
  // Get unique commenters
  const uniqueCommenters = new Set();
  comments.data.forEach(({comment}) => {
    if (comment.author && comment.author.username) {
      uniqueCommenters.add(comment.author.username);
    }
  });
  
  // Add new commenters
  uniqueCommenters.forEach((username, index) => {
    if (!currentAvatars.has(username)) {
      const floatingAvatar = createFloatingAvatar(
        username,
        index,
        uniqueCommenters.size
      );
      avatarSpace.appendChild(floatingAvatar);
    }
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