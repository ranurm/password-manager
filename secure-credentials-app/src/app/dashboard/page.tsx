'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCredentialStore } from '@/lib/store';
import { copyToClipboard } from '@/lib/utils';
import type { Credential, CredentialFormData } from '@/types';
import CredentialForm from '@/components/CredentialForm';

export default function DashboardPage() {
  const router = useRouter();
  const { 
    credentials, 
    isAuthenticated, 
    logout, 
    addCredential, 
    updateCredential, 
    deleteCredential, 
    toggleFavorite 
  } = useCredentialStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);
  
  // Get unique categories from credentials
  const categories = Array.from(
    new Set(credentials.map(cred => cred.category).filter(Boolean) as string[])
  );
  
  // Filter credentials based on search and category
  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = 
      cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cred.url && cred.url.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = !selectedCategory || cred.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Show notification temporarily
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };
  
  // Handle copying username or password
  const handleCopy = async (text: string, type: 'username' | 'password') => {
    const success = await copyToClipboard(text);
    if (success) {
      showNotification(`${type === 'username' ? 'Username' : 'Password'} copied to clipboard`);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle credential form submission
  const handleAddCredential = (data: CredentialFormData) => {
    addCredential(data);
    setShowAddCredential(false);
    showNotification('Credential added successfully');
  };
  
  // Handle edit credential
  const handleEditCredential = (credential: Credential) => {
    setEditingCredential(credential);
  };
  
  // Handle update credential
  const handleUpdateCredential = (data: CredentialFormData) => {
    if (editingCredential) {
      updateCredential(editingCredential.id, data);
      setEditingCredential(null);
      showNotification('Credential updated successfully');
    }
  };
  
  // Handle delete credential
  const handleDeleteCredential = (id: string) => {
    deleteCredential(id);
    setShowDeleteConfirm(null);
    showNotification('Credential deleted successfully');
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/auth');
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-900 shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Secure Password Manager</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddCredential(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add New
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {notification}
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-24">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search credentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                />
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">Categories</h2>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-2 py-1 rounded ${
                        selectedCategory === null 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      All
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category}>
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-2 py-1 rounded ${
                          selectedCategory === category 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Credentials list */}
          <div className="flex-1">
            {filteredCredentials.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'No credentials match your search'
                    : 'No credentials yet. Click "Add New" to create your first entry.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCredentials.map(credential => (
                  <div 
                    key={credential.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg truncate">{credential.title}</h3>
                      <button 
                        onClick={() => toggleFavorite(credential.id)}
                        className={`text-2xl leading-none ${credential.favorite ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500'}`}
                        title={credential.favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        ★
                      </button>
                    </div>
                    
                    {credential.url && (
                      <a 
                        href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 text-sm truncate block mb-2 hover:underline"
                      >
                        {credential.url}
                      </a>
                    )}
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Username</div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate max-w-[150px]">{credential.username}</span>
                          <button
                            onClick={() => handleCopy(credential.username, 'username')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Copy username"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Password</div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate max-w-[150px]">
                            {showPassword[credential.id] ? credential.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(credential.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title={showPassword[credential.id] ? "Hide password" : "Show password"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword[credential.id] 
                                ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
                                : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              } />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCopy(credential.password, 'password')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Copy password"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {credential.notes && (
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium mb-1">Notes:</div>
                          <p className="whitespace-pre-wrap break-words">{credential.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500">
                        Updated: {credential.updatedAt.toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          onClick={() => handleEditCredential(credential)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 text-sm"
                          onClick={() => setShowDeleteConfirm(credential.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Add Credential Modal */}
      {showAddCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CredentialForm
                onSubmit={handleAddCredential}
                onCancel={() => setShowAddCredential(false)}
                title="Add New Credential"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Credential Modal */}
      {editingCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CredentialForm
                onSubmit={handleUpdateCredential}
                onCancel={() => setEditingCredential(null)}
                initialData={editingCredential}
                title="Edit Credential"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="mb-6">Are you sure you want to delete this credential? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCredential(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 