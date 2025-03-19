'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { generatePassword, checkPasswordStrength, getPasswordStrengthLabel } from '@/lib/utils';
import type { CredentialFormData } from '@/types';

interface CredentialFormProps {
  onSubmit: (data: CredentialFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CredentialFormData>;
  title: string;
}

export default function CredentialForm({ 
  onSubmit, 
  onCancel, 
  initialData = {}, 
  title 
}: CredentialFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CredentialFormData>({
    defaultValues: {
      title: initialData.title || '',
      username: initialData.username || '',
      password: initialData.password || '',
      url: initialData.url || '',
      notes: initialData.notes || '',
      category: initialData.category || '',
      favorite: initialData.favorite || false
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [passwordOptions, setPasswordOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });
  
  const password = watch('password');
  const passwordStrength = checkPasswordStrength(password || '');
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);
  
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(passwordOptions);
    setValue('password', newPassword);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Gmail, Netflix, Bank"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-1">
          Website URL
        </label>
        <input
          id="url"
          type="text"
          {...register('url')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com"
        />
      </div>
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username/Email *
        </label>
        <input
          id="username"
          type="text"
          {...register('username', { required: 'Username is required' })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="user@example.com"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password *
          </label>
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Generate
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password', { required: 'Password is required' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword 
                ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
                : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              } />
            </svg>
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        
        {password && (
          <div className="mt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs">Strength: {strengthLabel}</span>
            </div>
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
              <div 
                className={`h-full rounded-full ${
                  passwordStrength === 0 ? 'bg-red-500 w-1/5' :
                  passwordStrength === 1 ? 'bg-orange-500 w-2/5' :
                  passwordStrength === 2 ? 'bg-yellow-500 w-3/5' :
                  passwordStrength === 3 ? 'bg-lime-500 w-4/5' : 'bg-green-500 w-full'
                }`}
              />
            </div>
          </div>
        )}
        
        <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium mb-2">Password Generator Options</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="password-length" className="block text-xs mb-1">
                Length: {passwordOptions.length}
              </label>
              <input
                id="password-length"
                type="range"
                min="8"
                max="64"
                value={passwordOptions.length}
                onChange={(e) => setPasswordOptions({
                  ...passwordOptions,
                  length: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center">
                <input
                  id="uppercase"
                  type="checkbox"
                  checked={passwordOptions.includeUppercase}
                  onChange={(e) => setPasswordOptions({
                    ...passwordOptions,
                    includeUppercase: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="uppercase" className="ml-2 text-xs">
                  Uppercase (A-Z)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="lowercase"
                  type="checkbox"
                  checked={passwordOptions.includeLowercase}
                  onChange={(e) => setPasswordOptions({
                    ...passwordOptions,
                    includeLowercase: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="lowercase" className="ml-2 text-xs">
                  Lowercase (a-z)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="numbers"
                  type="checkbox"
                  checked={passwordOptions.includeNumbers}
                  onChange={(e) => setPasswordOptions({
                    ...passwordOptions,
                    includeNumbers: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="numbers" className="ml-2 text-xs">
                  Numbers (0-9)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="symbols"
                  type="checkbox"
                  checked={passwordOptions.includeSymbols}
                  onChange={(e) => setPasswordOptions({
                    ...passwordOptions,
                    includeSymbols: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="symbols" className="ml-2 text-xs">
                  Symbols (!@#$%)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <input
          id="category"
          type="text"
          {...register('category')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Social Media, Banking, Work"
        />
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Add notes or additional information"
        />
      </div>
      
      <div className="flex items-center">
        <input
          id="favorite"
          type="checkbox"
          {...register('favorite')}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <label htmlFor="favorite" className="ml-2 text-sm">
          Mark as favorite
        </label>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
} 