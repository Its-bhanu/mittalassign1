import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [blogs, setBlogs] = useState([]);
  const [newBlog, setNewBlog] = useState({ title: '', description: '', image: null, imagePreview: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '' });

  useEffect(() => {
    if (user) fetchBlogs();
  }, [user]);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/blogs');
      const data = await res.json();
      setBlogs(data);
    } catch {
      setMessage({ text: 'Failed to fetch blogs', type: 'error' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setNewBlog(prev => ({ ...prev, image: file, imagePreview: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setMessage({ text: 'Image size should be less than 5MB', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newBlog.title);
    formData.append('description', newBlog.description);
    formData.append('author', user);
    if (newBlog.image) formData.append('image', newBlog.image);

    try {
      const res = await fetch('http://localhost:5000/api/blogs', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setBlogs([data, ...blogs]);
        setNewBlog({ title: '', description: '', image: null, imagePreview: '' });
        setMessage({ text: 'Blog posted successfully!', type: 'success' });
        setView('dashboard');
      } else {
        setMessage({ text: data.error || 'Error uploading blog', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleDeleteBlog = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlogs(blogs.filter(blog => blog._id !== id));
        setMessage({ text: 'Blog deleted successfully', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Error deleting blog', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleAuth = (e, isLogin) => {
    e.preventDefault();
    const data = isLogin ? loginData : registerData;
    if (data.username && data.password) {
      setUser(data.username);
      setView('dashboard');
    }
  };

  const handleEditBlog = (blog) => {
    setNewBlog({ title: blog.title, description: blog.description, image: null, imagePreview: blog.image });
    setView('add');
    alert(`Editing blog ${blog.title} Which mention upper side`);
  };

  if (!user) {
    const isLogin = view === 'login';
    const formData = isLogin ? loginData : registerData;
    const setFormData = isLogin ? setLoginData : setRegisterData;

    return (
      <div className="auth-container">
        <form onSubmit={(e) => handleAuth(e, isLogin)} className="auth-form">
          <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
          <input type="text" placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
          <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
          <p onClick={() => setView(isLogin ? 'register' : 'login')} className="link">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h2>Blog Dashboard</h2>
        <div className="nav-buttons">
          <button onClick={() => setView('add')} className="nav-btn">Add Blog</button>
          <button onClick={() => { setUser(null); setView('login'); }} className="nav-btn">Logout</button>
        </div>
      </nav>

      <div className="main-container">
        {message.text && <div className={message.type === 'error' ? 'error-message' : 'success-message'}>{message.text}</div>}

        {view === 'dashboard' && (
          <div className="welcome text-center">
            <h2 className="mb-2">Welcome {user} 👋</h2>
            <p className="mb-3">You have <strong>{blogs.length}</strong> blog{blogs.length !== 1 ? 's' : ''}.</p>
            <button onClick={() => setView('add')} className="nav-btn">Create New Blog</button>
          </div>
        )}

        {view === 'add' && (
          <div className="blog-form-container">
            <form onSubmit={handleSubmit} className="blog-form">
              <h2>Create New Blog</h2>
              <input type="text" placeholder="Title" value={newBlog.title} onChange={e => setNewBlog({ ...newBlog, title: e.target.value })} required />
              <textarea placeholder="Description" value={newBlog.description} onChange={e => setNewBlog({ ...newBlog, description: e.target.value })} required />
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {newBlog.imagePreview && <img src={newBlog.imagePreview} alt="Preview" className="preview-image" />}
              <button type="submit" className="nav-btn">Publish Blog</button>
              <button type="button" className="nav-btn cancel" onClick={() => setView('dashboard')}>Cancel</button>
            </form>
          </div>
        )}

        <div className="blog-list">
          <h2 className="text-center mb-4">Blog Posts</h2>
          {blogs.length === 0 ? (
            <p>No blogs found. Create one!</p>
          ) : (
            blogs.map(blog => (
              <div key={blog._id} className="blog-card">
                <h3>{blog.title}</h3>
                <p>{blog.description}</p>
                {blog.image && <img src={blog.image} alt={blog.title} className="blog-image" />}
                <div className="blog-meta">
                  <small>Posted on: {new Date(blog.createdAt).toLocaleDateString()}</small>
                  <button onClick={() => handleDeleteBlog(blog._id)} className="nav-btn delete">Delete</button>
                  <button onClick={() => handleEditBlog(blog)} className="nav-btn edit">Edit</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Blog Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
