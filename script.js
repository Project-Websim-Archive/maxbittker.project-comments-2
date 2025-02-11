async function getCurrentProject() {
  const project = await window.websim.getCurrentProject();
  return project.id;
}

async function fetchCommentPage(projectId, cursor = null) {
  const params = new URLSearchParams();
  if (cursor) params.set('after', cursor);
  params.set('first', '100');
  
  const response = await fetch(`/api/v1/projects/${projectId}/comments?${params}`);
  const data = await response.json();
  return data.comments;
}

async function* commentPaginator(projectId) {
  let hasNextPage = true;
  let cursor = null;
  
  while (hasNextPage) {
    const page = await fetchCommentPage(projectId, cursor);
    yield page.data;
    
    hasNextPage = page.meta.has_next_page;
    cursor = page.meta.end_cursor;
  }
}

function createAvatarElement(username, index) {
  const avatar = document.createElement('img');
  avatar.className = 'floating-avatar';
  avatar.src = `https://images.websim.ai/avatar/${username}`;
  avatar.alt = username;
  avatar.title = `@${username}`;
  
  // Add animation delay based on index
  avatar.style.animationDelay = `${index * 0.3}s`;
  
  const link = document.createElement('a');
  link.href = `https://websim.ai/@${username}`;
  link.appendChild(avatar);
  
  return link;
}

async function loadInitialCommenters(projectId, avatarSpace) {
  // Track unique commenters we've already added
  const addedUsernames = new Set();
  let currentIndex = 0;
  
  for await (const comments of commentPaginator(projectId)) {
    // Sort comments by creation date (oldest first)
    const sortedComments = comments.sort((a, b) => 
      new Date(a.comment.created_at) - new Date(b.comment.created_at)
    );
    
    // Add new unique commenters
    for (const {comment} of sortedComments) {
      if (comment.author && comment.author.username && !addedUsernames.has(comment.author.username)) {
        addedUsernames.add(comment.author.username);
        const avatarLink = createAvatarElement(comment.author.username, currentIndex++);
        avatarSpace.appendChild(avatarLink);
        
        // Small delay to make the appearance smoother
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}

async function updateCommenters(projectId, avatarSpace) {
  const comments = await fetchCommentPage(projectId);
  
  // Get current usernames displayed
  const currentUsernames = new Set(
    Array.from(avatarSpace.children).map(link => 
      link.querySelector('img').alt
    )
  );
  
  // Add only new commenters
  const currentIndex = currentUsernames.size;
  for (const {comment} of comments.data) {
    if (comment.author && comment.author.username && !currentUsernames.has(comment.author.username)) {
      currentUsernames.add(comment.author.username);
      const avatarLink = createAvatarElement(comment.author.username, currentIndex + currentUsernames.size);
      avatarSpace.appendChild(avatarLink);
    }
  }
}

function setupAudio() {
  const music = document.getElementById('background-music');
  const muteButton = document.getElementById('mute-button');
  const startButton = document.getElementById('start-button');
  let isPlaying = false;

  startButton.addEventListener('click', () => {
    if (!isPlaying) {
      music.play();
      isPlaying = true;
      startButton.textContent = 'Playing...';
      startButton.disabled = true;
    }
  });

  muteButton.addEventListener('click', () => {
    if (music.muted) {
      music.muted = false;
      muteButton.textContent = '';
    } else {
      music.muted = true;
      muteButton.textContent = '';
    }
  });

  // Click anywhere to play
  document.addEventListener('click', () => {
    if (!isPlaying) {
      music.play();
      isPlaying = true;
      startButton.textContent = 'Playing...';
      startButton.disabled = true;
    }
  });

  // Handle audio loaded
  music.addEventListener('canplaythrough', () => {
    startButton.disabled = false;
  });
}

function getRandomPosition(size) {
  return Math.random() * (100 - size);
}

function getRandomSize() {
  return Math.random() * (80 - 30) + 30;
}

function setupThumbnailMode() {
  const thumbnailUsers = [
    'maxbittker', 'rob', 'kat', 'sean', 
    'astoundingbutterfly24227262', 'OneshotFan123', 'cidy'
  ];
  
  document.body.classList.add('thumbnail-mode');
  const avatarSpace = document.getElementById('avatar-space');
  avatarSpace.innerHTML = '';

  thumbnailUsers.forEach((username, index) => {
    const avatarLink = createAvatarElement(username, index);
    const size = getRandomSize();
    
    // Position randomly
    avatarLink.style.position = 'absolute';
    avatarLink.style.left = getRandomPosition(size) + '%';
    avatarLink.style.top = getRandomPosition(size) + '%';
    
    // Random size
    const avatarImg = avatarLink.querySelector('img');
    avatarImg.style.width = size + 'px';
    avatarImg.style.height = size + 'px';
    
    avatarSpace.appendChild(avatarLink);
  });
}

async function init() {
  try {
    const isThumbnail = window.innerWidth === window.innerHeight;
    
    if (isThumbnail) {
      setupThumbnailMode();
    } else {
      const projectId = await getCurrentProject();
      const avatarSpace = document.getElementById('avatar-space');
      
      // Initialize audio
      setupAudio();
      
      // Initial load - paginate through all results
      await loadInitialCommenters(projectId, avatarSpace);
      
      // Poll for new comments every 3 seconds
      setInterval(() => {
        updateCommenters(projectId, avatarSpace);
      }, 3000);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

init();

// Add resize listener to handle switching modes
window.addEventListener('resize', () => {
  const isThumbnail = window.innerWidth === window.innerHeight;
  const wasAlreadyThumbnail = document.body.classList.contains('thumbnail-mode');
  
  if (isThumbnail && !wasAlreadyThumbnail) {
    setupThumbnailMode();
  } else if (!isThumbnail && wasAlreadyThumbnail) {
    document.body.classList.remove('thumbnail-mode');
    init();
  }
});