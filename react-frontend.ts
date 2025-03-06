// src/App.tsx - Main application component
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './apollo-client';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import './App.css';

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <div className="app-container">
        <header>
          <h1>User Management</h1>
        </header>
        <div className="content">
          <UserForm />
          <UserList />
        </div>
      </div>
    </ApolloProvider>
  );
};

export default App;

// src/apollo-client.ts - Apollo client configuration
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

export default client;

// src/graphql/queries.ts - GraphQL queries and mutations
import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      age
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      age
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $age: Int) {
    createUser(name: $name, age: $age) {
      id
      name
      age
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $name: String, $age: Int) {
    updateUser(id: $id, name: $name, age: $age) {
      id
      name
      age
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

// src/components/UserList.tsx - Component to display users
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USERS, DELETE_USER } from '../graphql/queries';
import UserEditForm from './UserEditForm';
import '../styles/UserList.css';

interface User {
  id: string;
  name: string;
  age: number;
}

const UserList: React.FC = () => {
  const { loading, error, data, refetch } = useQuery(GET_USERS);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => {
      refetch();
    }
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser({ variables: { id } });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUpdateComplete = () => {
    setEditingUser(null);
    refetch();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="user-list">
      <h2>Users</h2>
      {editingUser && (
        <UserEditForm 
          user={editingUser} 
          onCancel={handleCancelEdit} 
          onComplete={handleUpdateComplete} 
        />
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.users.map((user: User) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.age}</td>
              <td>
                <button 
                  className="edit-button" 
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </button>
                <button 
                  className="delete-button" 
                  onClick={() => handleDelete(user.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data?.users.length === 0 && <p>No users found</p>}
    </div>
  );
};

export default UserList;

// src/components/UserForm.tsx - Form to create new users
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_USER, GET_USERS } from '../graphql/queries';
import '../styles/UserForm.css';

const UserForm: React.FC = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [error, setError] = useState('');

  const [createUser, { loading }] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: () => {
      setName('');
      setAge('');
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const variables: { name: string; age?: number } = { name };
    if (age !== '') {
      variables.age = Number(age);
    }

    createUser({ variables });
  };

  return (
    <div className="user-form">
      <h2>Add New User</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </div>
  );
};

export default UserForm;

// src/components/UserEditForm.tsx - Form to edit existing users
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_USER } from '../graphql/queries';
import '../styles/UserEditForm.css';

interface User {
  id: string;
  name: string;
  age: number;
}

interface Props {
  user: User;
  onCancel: () => void;
  onComplete: () => void;
}

const UserEditForm: React.FC<Props> = ({ user, onCancel, onComplete }) => {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState<number | ''>(user.age || '');
  const [error, setError] = useState('');

  const [updateUser, { loading }] = useMutation(UPDATE_USER, {
    onCompleted: onComplete,
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const variables: { id: string; name: string; age?: number } = { 
      id: user.id,
      name 
    };
    
    if (age !== '') {
      variables.age = Number(age);
    }

    updateUser({ variables });
  };

  return (
    <div className="user-edit-form">
      <h3>Edit User</h3>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="edit-name">Name:</label>
          <input
            type="text"
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-age">Age:</label>
          <input
            type="number"
            id="edit-age"
            value={age}
            onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserEditForm;

// src/styles/App.css - Main application styles
.app-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

header {
  background-color: #2c3e50;
  color: white;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}

.content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
}

// src/styles/UserList.css - User list component styles
.user-list {
  background-color: white;
  border-radius: 5px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

tr:hover {
  background-color: #f5f5f5;
}

.edit-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 5px;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
}

.edit-button:hover {
  background-color: #2980b9;
}

.delete-button:hover {
  background-color: #c0392b;
}

// src/styles/UserForm.css - User form component styles
.user-form {
  background-color: white;
  border-radius: 5px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #27ae60;
}

button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

// src/styles/UserEditForm.css - User edit form component styles
.user-edit-form {
  background-color: #f7f9fa;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

.user-edit-form h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.user-edit-form .form-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.user-edit-form button[type="button"] {
  background-color: #95a5a6;
}

.user-edit-form button[type="button"]:hover:not(:disabled) {
  background-color: #7f8c8d;
}
