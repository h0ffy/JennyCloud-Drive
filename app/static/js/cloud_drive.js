// --- Existing Particle Animation Code ---
const canvas = document.getElementById('neuralCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const particleColor = 'rgba(172, 139, 255, 0.7)'; // Light purple with transparency

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1.5;
        this.speedY = Math.random() * 2 - 1.5;
    }
    draw() {
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) {
            this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.speedY = -this.speedY;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.draw();
    }
}

function initParticles() {
    particlesArray = [];
    const currentNumberOfParticles = (canvas.width * canvas.height) / 9000; 
    for (let i = 0; i < currentNumberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

function connectParticles() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distanceSquared = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            
            const maxDistanceSquared = (canvas.width / 15) * (canvas.height / 15) > 20000 ? (canvas.width / 15) * (canvas.height / 15) : 20000;

            if (distanceSquared < maxDistanceSquared) {
                opacityValue = 1 - (distanceSquared / maxDistanceSquared);
                ctx.strokeStyle = `rgba(172, 139, 255, ${opacityValue * 0.5})`; 
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connectParticles();
}

window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles(); 
});

initParticles();
animateParticles();

// --- Cloud Drive Application ---
const CLOUD_API_BASE = 'http://10.69.69.1:80/api';
let cloudFiles = [];
let isAuthenticated = false;
let currentUser = null;

// DOM Elements
const fileGrid = document.getElementById('fileGrid');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const loginModal = document.getElementById('loginModal');
const userAvatar = document.getElementById('userAvatar');
const searchInput = document.getElementById('searchInput');

// Cloud Storage API Client
class CloudStorageDriver {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('cloud_token') || null;
    }

    async authenticate(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.token = data.access_token;
                localStorage.setItem('cloud_token', this.token);
                return { success: true, user: data.user };
            }
            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: 'Connection failed' };
        }
    }

    async uploadFile(file, onProgress) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.baseUrl}/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    async listFiles() {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${this.baseUrl}/files/list`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`List files failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('List files error:', error);
            // Return mock data for demo
            return [
                { id: '1', name: 'Document.pdf', size: 1024000, type: 'pdf', date: '2024-01-15' },
                { id: '2', name: 'Presentation.pptx', size: 2048000, type: 'presentation', date: '2024-01-14' },
                { id: '3', name: 'Spreadsheet.xlsx', size: 512000, type: 'spreadsheet', date: '2024-01-13' },
                { id: '4', name: 'Image.jpg', size: 256000, type: 'image', date: '2024-01-12' },
                { id: '5', name: 'Video.mp4', size: 10240000, type: 'video', date: '2024-01-11' }
            ];
        }
    }

    async downloadFile(fileId) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${this.baseUrl}/files/download/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                return response.blob();
            } else {
                throw new Error(`Download failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    async deleteFile(fileId) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${this.baseUrl}/files/delete/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }
}

const cloudStorage = new CloudStorageDriver(CLOUD_API_BASE);

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type) {
    const icons = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'presentation': '📊',
        'pptx': '📊',
        'spreadsheet': '📈',
        'xlsx': '📈',
        'image': '🖼️',
        'jpg': '🖼️',
        'png': '🖼️',
        'video': '🎥',
        'mp4': '🎥',
        'audio': '🎵',
        'mp3': '🎵',
        'folder': '📁',
        'default': '📄'
    };
    return icons[type] || icons['default'];
}

function showStatus(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 3000);
}

// File Grid Management
function renderFileGrid(files) {
    fileGrid.innerHTML = '';
    if (files.length === 0) {
        uploadZone.classList.remove('hidden');
        return;
    }

    uploadZone.classList.add('hidden');

    files.forEach(file => {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        fileCard.innerHTML = `
            <div class="file-icon">${getFileIcon(file.type)}</div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
            <div class="file-date">${new Date(file.date).toLocaleDateString()}</div>
        `;
        
        fileCard.addEventListener('click', () => handleFileClick(file));
        fileCard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showFileContextMenu(e, file);
        });
        
        fileGrid.appendChild(fileCard);
    });
}

function handleFileClick(file) {
    console.log('File clicked:', file);
    // Handle file preview or download
}

function showFileContextMenu(event, file) {
    // Create and show context menu
    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.background = 'rgba(20, 20, 35, 0.95)';
    contextMenu.style.border = '1px solid rgba(106, 68, 255, 0.3)';
    contextMenu.style.borderRadius = '8px';
    contextMenu.style.padding = '8px';
    contextMenu.style.zIndex = '1000';
    
    contextMenu.innerHTML = `
        <div style="padding: 8px 12px; cursor: pointer; color: #e0d1ff;" onclick="downloadFile('${file.id}', '${file.name}')">Download</div>
        <div style="padding: 8px 12px; cursor: pointer; color: #ff4444;" onclick="deleteFile('${file.id}')">Delete</div>
    `;
    
    document.body.appendChild(contextMenu);
    
    setTimeout(() => {
        contextMenu.remove();
    }, 3000);
}

// Authentication
function showLoginModal() {
    loginModal.classList.add('active');
}

function hideLoginModal() {
    loginModal.classList.remove('active');
}

function updateAuthState(authenticated, user = null) {
    isAuthenticated = authenticated;
    currentUser = user;
    
    if (authenticated) {
        userAvatar.textContent = user?.username?.charAt(0).toUpperCase() || 'U';
        loadFiles();
    } else {
        userAvatar.textContent = 'U';
    }
}

// File Operations
async function loadFiles() {
    try {
        const files = await cloudStorage.listFiles();
        cloudFiles = files;
        renderFileGrid(files);
    } catch (error) {
        console.error('Failed to load files:', error);
        showStatus('Failed to load files', 'error');
    }
}

async function uploadFiles(files) {
    for (const file of files) {
        try {
            showStatus(`Uploading ${file.name}...`, 'info');
            await cloudStorage.uploadFile(file);
            showStatus(`✓ ${file.name} uploaded successfully`, 'success');
        } catch (error) {
            showStatus(`✗ Failed to upload ${file.name}`, 'error');
        }
    }
    loadFiles();
}

async function downloadFile(fileId, fileName) {
    try {
        const blob = await cloudStorage.downloadFile(fileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showStatus(`✓ ${fileName} downloaded`, 'success');
    } catch (error) {
        showStatus(`✗ Failed to download ${fileName}`, 'error');
    }
}

async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
        await cloudStorage.deleteFile(fileId);
        showStatus('File deleted successfully', 'success');
        loadFiles();
    } catch (error) {
        showStatus('Failed to delete file', 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status
    if (cloudStorage.token) {
        updateAuthState(true, { username: 'user' });
    } else {
        showLoginModal();
    }
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const result = await cloudStorage.authenticate(username, password);
        
        if (result.success) {
            updateAuthState(true, result.user);
            hideLoginModal();
            showStatus('Welcome to Purple Drive!', 'success');
        } else {
            document.getElementById('loginStatus').innerHTML = `
                <div class="status-message status-error">${result.error}</div>
            `;
        }
    });
    
    // Modal close
    document.getElementById('closeModal').addEventListener('click', hideLoginModal);
    
    // Upload button
    document.getElementById('uploadButton').addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadFiles(e.target.files);
        }
    });
    
    // Upload zone
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        uploadFiles(e.dataTransfer.files);
    });
    
    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', loadFiles);
    
    // Search
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredFiles = cloudFiles.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
        renderFileGrid(filteredFiles);
    });
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const section = item.dataset.section;
            // Handle different sections
            switch (section) {
                case 'my-drive':
                    renderFileGrid(cloudFiles);
                    break;
                case 'recent':
                    const recentFiles = cloudFiles.slice(0, 5);
                    renderFileGrid(recentFiles);
                    break;
                default:
                    renderFileGrid([]);
            }
        });
    });
    
    // View toggles
    document.querySelectorAll('.view-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            document.querySelectorAll('.view-toggle').forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');
            
            const view = toggle.dataset.view;
            if (view === 'list') {
                fileGrid.style.display = 'block';
                // Implement list view
            } else {
                fileGrid.style.display = 'grid';
            }
        });
    });
    
    // User avatar click
    userAvatar.addEventListener('click', () => {
        if (isAuthenticated) {
            if (confirm('Do you want to sign out?')) {
                cloudStorage.token = null;
                localStorage.removeItem('cloud_token');
                updateAuthState(false);
                showLoginModal();
            }
        } else {
            showLoginModal();
        }
    });
});

// Global functions for context menu
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;
