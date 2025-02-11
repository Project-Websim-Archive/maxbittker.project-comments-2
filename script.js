async function getCurrentProject() {
  const project = await window.websim.getCurrentProject();
  return project.id;
}

async function fetchComments(projectId) {
  const response = await fetch(`/api/v1/projects/${projectId}/comments`);
  const data = await response.json();
  return data.comments;
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

async function updateCommenters(projectId, avatarSpace) {
  const comments = await fetchComments(projectId);
  
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
  
  // Get current usernames displayed
  const currentUsernames = Array.from(avatarSpace.children).map(link => 
    link.querySelector('img').alt
  );
  
  // Add only new commenters that aren't already displayed
  uniqueCommenters.forEach((author, index) => {
    if (!currentUsernames.includes(author.username)) {
      const avatarLink = createAvatarElement(author.username, index);
      avatarSpace.appendChild(avatarLink);
    }
  });
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
      
      // Initial load
      await updateCommenters(projectId, avatarSpace);
      
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