async function getProject() {
  const project = await window.websim.getProject();
  return project.id;
}

async function fetchComments(projectId) {
  const response = await fetch(`/api/v1/projects/${projectId}/comments`);
  const data = await response.json();
  return data.comments;
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

async function init() {
  try {
    const projectId = await getProject();
    const comments = await fetchComments(projectId);
    
    const commentsContainer = document.getElementById('comments');
    
    comments.data.forEach(({comment}) => {
      if (!comment.parent_comment_id) { // Only show top-level comments initially
        const commentElement = createCommentElement(comment);
        commentsContainer.appendChild(commentElement);
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
}

init();