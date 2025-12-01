// Variables that will be initialized after DOM is ready
let items;
let prevBtn;
let nextBtn;
let lastPosition;
let firstPosition = 0;
let active = 0;
let currentAudio = null;
let audioTimeout = null;
let audioEnabled = false;
let userControlledAudio = false; // Flag to track if user manually controls audio
const SNIPPET_DURATION = 60000; // 60 seconds in milliseconds

// Enable audio after first user interaction (required by browsers)
const enableAudio = () => {
    if (!audioEnabled) {
        audioEnabled = true;
        // Try to play and immediately pause to "unlock" audio
        if (items && items.length > 0) {
            const firstAudio = items[0].querySelector('.slide-audio');
            if (firstAudio) {
                const source = firstAudio.querySelector('source');
                if (source && source.src) {
                    firstAudio.src = source.src;
                    firstAudio.play().then(() => {
                        firstAudio.pause();
                        firstAudio.currentTime = 0;
                    }).catch(() => {
                        // Ignore errors on unlock attempt
                    });
                }
            }
        }
    }
};

// Enable audio on any user interaction
document.addEventListener('click', enableAudio, { once: true });
document.addEventListener('touchstart', enableAudio, { once: true });

// Update play/pause button state
const updatePlayPauseButton = (slideIndex, isPlaying) => {
    const button = document.querySelector(`.play-pause-btn[data-slide="${slideIndex}"]`);
    if (button) {
        if (isPlaying) {
            button.classList.add('playing');
        } else {
            button.classList.remove('playing');
        }
    }
};

// Sync button state with audio state
const syncButtonWithAudio = (slideIndex, audio) => {
    if (audio && !audio.paused && !audio.ended) {
        updatePlayPauseButton(slideIndex, true);
    } else {
        updatePlayPauseButton(slideIndex, false);
    }
};

// Update all play/pause buttons to not playing
const resetAllPlayPauseButtons = () => {
    document.querySelectorAll('.play-pause-btn').forEach(btn => {
        btn.classList.remove('playing');
    });
};


// Stop all audio
const stopAllAudio = () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    if (audioTimeout) {
        clearTimeout(audioTimeout);
        audioTimeout = null;
    }
    resetAllPlayPauseButtons();
};

// Play audio snippet for active slide
const playAudioSnippet = () => {
    // Don't auto-play if user is manually controlling audio
    if (userControlledAudio) {
        return;
    }
    
    stopAllAudio();
    
    // Only play if audio is enabled (user has interacted)
    if (!audioEnabled || !items || !items[active]) {
        return;
    }
    
    const activeItem = items[active];
    const audio = activeItem.querySelector('.slide-audio');
    
    if (audio) {
        // Get the source from the source element
        const source = audio.querySelector('source');
        if (source && source.src) {
            // Set audio.src from the source element
            audio.src = source.src;
        }
        
        // Check if we have a valid src
        if (audio.src) {
            currentAudio = audio;
            audio.currentTime = 0;
            
            // Load the audio first to get metadata
            audio.load();
            
            
            // Try to play after a short delay to ensure it's loaded
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Audio is playing
                    console.log('Audio playing for slide', active);
                    updatePlayPauseButton(active, true);
                }).catch(err => {
                    console.log('Audio play failed:', err);
                    updatePlayPauseButton(active, false);
                });
            }
            
            // Stop after snippet duration
            audioTimeout = setTimeout(() => {
                if (currentAudio === audio && !userControlledAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    currentAudio = null;
                    updatePlayPauseButton(active, false);
                }
            }, SNIPPET_DURATION);
        } else {
            console.log('No audio source found for slide', active);
        }
    }
};

const setSlider = () => {
    if (!items || !prevBtn || !nextBtn) return;
    
    let oldActive = document.querySelector('.slider .list .item.active');
    if(oldActive) oldActive.classList.remove('active');
    items[active].classList.add('active');
    // 
    nextBtn.classList.remove('d-none');
    prevBtn.classList.remove('d-none');
    if(active == lastPosition) nextBtn.classList.add('d-none');
    if(active == firstPosition) prevBtn.classList.add('d-none');
    
    // Reset user control flag when navigating to allow auto-play
    userControlledAudio = false;
    
    // Automatically play audio for the active slide
    playAudioSnippet();
}

// Menu functionality - will be initialized after DOM is ready
let menuToggle;
let menuOverlay;
let menuClose;
let menuLinks;

// Setup audio event listeners to sync button states
const setupAudioEventListeners = () => {
    if (!items || items.length === 0) return;
    items.forEach((item, index) => {
        const audio = item.querySelector('.slide-audio');
        if (audio) {
            audio.addEventListener('play', () => {
                updatePlayPauseButton(index, true);
            });
            audio.addEventListener('pause', () => {
                updatePlayPauseButton(index, false);
            });
            audio.addEventListener('ended', () => {
                updatePlayPauseButton(index, false);
            });
        }
    });
};

// Setup play/pause button functionality
const setupPlayPauseButtons = () => {
    const buttons = document.querySelectorAll('.play-pause-btn');
    if (buttons.length === 0) {
        console.log('No play/pause buttons found');
        return;
    }
    
    if (!items || items.length === 0) {
        console.error('Items not available for play/pause buttons');
        return;
    }
    
    buttons.forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Play/pause button clicked');
            enableAudio();
            userControlledAudio = true;
    
            const slideIndex = parseInt(btn.getAttribute('data-slide'), 10);
            if (isNaN(slideIndex)) {
                console.error('Invalid slide index');
                return;
            }
    
            const slideItem = items[slideIndex];
            if (!slideItem) {
                console.error('Slide item not found for index:', slideIndex);
                return;
            }
    
            const audio = slideItem.querySelector('.slide-audio');
            if (!audio) {
                console.error('Audio element not found for slide:', slideIndex);
                return;
            }
    
            // Get the source URL from the source element
            const source = audio.querySelector('source');
            if (!source) {
                console.error('No source element found for slide:', slideIndex);
                return;
            }
            
            const audioSrc = source.getAttribute('src');
            if (!audioSrc) {
                console.error('No audio source URL found for slide:', slideIndex);
                return;
            }
    
            // Ensure audio src is set (browser may not have resolved source element yet)
            if (!audio.src || !audio.src.includes(audioSrc)) {
                audio.src = audioSrc;
                audio.load();
            }
    
            // 🎯 TOGGLE BASED ON audio STATE, NOT currentAudio
            // Check if this specific audio is currently playing
            const isPlaying = currentAudio === audio && !audio.paused && !audio.ended;
    
            if (isPlaying) {
                // Pause current audio
                console.log('Pausing audio at', audio.currentTime);
                audio.pause();
                if (audioTimeout) {
                    clearTimeout(audioTimeout);
                    audioTimeout = null;
                }
                if (currentAudio === audio) {
                    currentAudio = null;
                }
                updatePlayPauseButton(slideIndex, false);
                userControlledAudio = false;
            } else {
                // Play this audio, stop others
                console.log('Playing audio for slide:', slideIndex, 'src:', audioSrc);
                
                // Stop any other playing audio
                if (currentAudio && currentAudio !== audio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    const otherIndex = Array.from(items).findIndex(item => item.querySelector('.slide-audio') === currentAudio);
                    if (otherIndex !== -1) {
                        updatePlayPauseButton(otherIndex, false);
                    }
                }
    
                currentAudio = audio;
                
                // Reset to beginning before playing
                audio.currentTime = 0;
    
                // Play the audio
                // Don't call load() unnecessarily - it causes re-requests
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('Audio playing successfully for slide:', slideIndex);
                        updatePlayPauseButton(slideIndex, true);
        
                        // Clear any existing timeout
                        if (audioTimeout) {
                            clearTimeout(audioTimeout);
                            audioTimeout = null;
                        }
        
                        // For user-controlled playback, let it play to the end
                        // Don't set an auto-stop timeout
                    }).catch(err => {
                        console.error('Play failed:', err);
                        updatePlayPauseButton(slideIndex, false);
                        userControlledAudio = false;
                        currentAudio = null;
                    });
                } else {
                    // Fallback for older browsers
                    audio.play();
                    updatePlayPauseButton(slideIndex, true);
                }
            }
        };
    });
    
    console.log('Play/pause buttons setup complete:', buttons.length);
};

// Setup track link navigation
const setupTrackLinks = () => {
    const trackLinks = document.querySelectorAll('.track-link');
    trackLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const slideIndex = parseInt(link.getAttribute('data-slide'));
            if (!isNaN(slideIndex) && slideIndex >= 0 && slideIndex < items.length) {
                active = slideIndex;
                setSlider();
            }
        };
    });
    console.log('Track links setup complete:', trackLinks.length);
};


// Setup buttons and audio listeners when DOM is ready
const setupAll = () => {
    if (!items || items.length === 0) {
        console.error('Items not initialized');
        return;
    }
    setupAudioEventListeners();
    setupPlayPauseButtons();
    setupTrackLinks();
};

// Initialize all DOM-dependent functionality
const init = () => {
    // Query DOM elements
    items = document.querySelectorAll('.slider .list .item');
    prevBtn = document.getElementById('prev');
    nextBtn = document.getElementById('next');
    menuToggle = document.getElementById('menu-toggle');
    menuOverlay = document.getElementById('menu-overlay');
    menuClose = document.getElementById('menu-close');
    menuLinks = document.querySelectorAll('.menu-link[data-slide]');
    
    // Check if essential elements exist
    if (!items || items.length === 0) {
        console.error('No slider items found');
        return;
    }
    
    if (!prevBtn || !nextBtn) {
        console.error('Navigation buttons not found');
        return;
    }
    
    // Initialize position variables
    lastPosition = items.length - 1;
    
    // Setup navigation buttons
    nextBtn.onclick = () => {
        enableAudio();
        active = active + 1;
        setSlider();
    };
    
    prevBtn.onclick = () => {
        enableAudio();
        active = active - 1;
        setSlider();
    };
    
    // Setup menu functionality
    if (menuToggle && menuOverlay) {
        menuToggle.onclick = () => {
            stopAllAudio();
            menuOverlay.classList.add('active');
            document.body.classList.add('menu-open');
        };
    }
    
    if (menuClose && menuOverlay) {
        menuClose.onclick = () => {
            menuOverlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        };
    }
    
    if (menuOverlay) {
        menuOverlay.onclick = (e) => {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        };
    }
    
    // Navigate to slide from menu
    if (menuLinks) {
        menuLinks.forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                enableAudio();
                const slideIndex = parseInt(link.getAttribute('data-slide'));
                if (!isNaN(slideIndex) && slideIndex >= 0 && slideIndex < items.length) {
                    active = slideIndex;
                    setSlider();
                    if (menuOverlay) {
                        menuOverlay.classList.remove('active');
                        document.body.classList.remove('menu-open');
                    }
                }
            };
        });
    }
    
    // Initialize slider
    setSlider();
    
    // Setup audio and buttons
    setupAll();
    
    // Set diameter
    setDiameter();
};

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// set diameter
const setDiameter = () => {
    let slider = document.querySelector('.slider');
    if (!slider) return;
    let widthSlider = slider.offsetWidth;
    let heightSlider = slider.offsetHeight;
    let diameter = Math.sqrt(Math.pow(widthSlider, 2) + Math.pow(heightSlider, 2));
    document.documentElement.style.setProperty('--diameter', diameter+'px');
}

window.addEventListener('resize', () => {
    setDiameter();
});