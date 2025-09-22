import React from 'react'

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to WTI Tech N-Tier Application</h1>
      <div className="card" style={{ padding: '24px' }}>
        <h2>Dashboard</h2>
        <p>This is a comprehensive 3-tier application built with:</p>
        <ul>
          <li>
            <strong>Frontend:</strong> React with TypeScript, Redux Toolkit, Material-UI
          </li>
          <li>
            <strong>Backend:</strong> Python FastAPI with raw SQL queries
          </li>
          <li>
            <strong>Database:</strong> PostgreSQL
          </li>
          <li>
            <strong>External API:</strong> JSONPlaceholder integration
          </li>
          <li>
            <strong>Deployment:</strong> AWS infrastructure with CDK
          </li>
        </ul>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3>Features</h3>
        <ul>
          <li>✅ CRUD Operations for Posts and Users</li>
          <li>✅ JWT Authentication</li>
          <li>✅ External API Integration</li>
          <li>✅ State Management with Redux</li>
          <li>✅ Raw SQL Queries (No ORM)</li>
          <li>✅ AWS Well-Architected Framework</li>
        </ul>
      </div>
    </div>
  )
}

export default HomePage
