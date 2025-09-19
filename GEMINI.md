# Project Overview

This is a web application for employee performance evaluations. It is built with Angular and Node.js and uses a micro-frontend architecture with module federation. The application has a rich set of features, including:

*   User authentication and authorization
*   Dashboard for visualizing data
*   Management of employees, departments, and positions
*   Creation and management of evaluation periods and policies
*   Performance evaluation workflows
*   Reporting and analytics

## Building and Running

### Development

To run the application in development mode, use the following command:

```bash
npm start
```

This will start a development server on `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Production

To build the application for production, use the following command:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Testing

To run the unit tests, use the following command:

```bash
npm test
```

## Development Conventions

*   The project uses the Angular CLI for code generation and other development tasks.
*   The code is written in TypeScript and follows the official Angular style guide.
*   The project uses a custom webpack configuration for both development and production builds.
*   The project uses module federation to share code between different applications.
*   The project uses server-side rendering (SSR) to improve performance and SEO.
