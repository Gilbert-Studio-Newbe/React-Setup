# React Flow Next.js 14 Application

This is a Next.js 14 application with App Router that demonstrates the use of React Flow for creating interactive node-based diagrams. The application showcases various custom node types and edge types that can be used to build complex diagrams.

## Features

- Drag and drop interface for creating and connecting nodes
- Number Input: Allows numeric input with min/max constraints
- Cost Input: Specialized input for cost values with currency
- Calculation: Performs mathematical operations on inputs
- Join String: Concatenates text values with a customizable separator
- CSV Import: Imports and parses CSV files with preview
- JSON Load: Loads and parses JSON data
- JSON Display: Displays and extracts values from JSON
- Debug Display: Shows internal data of connected nodes
- Result: Displays calculation results with formatting options
- Interactive node-based diagrams using React Flow
- Custom node types:
  - Circle Node: Displays position information
  - Text Input Node: Allows dimension adjustments
  - Annotation Node: Displays informational annotations
  - Toolbar Node: Includes emoji selection toolbar
  - Resizer Node: Resizable node with multiple handles
- Custom edge types:
  - Button Edge: Edge with a delete button
- Dark mode support
- Responsive design with Tailwind CSS

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Next.js App Router pages
  - `page.tsx`: Home page with link to flow diagram
  - `flow/page.tsx`: Flow diagram page
- `src/components`: React components
  - `CircleNode.tsx`: Circle node component
  - `TextInputNode.tsx`: Text input node component
  - `AnnotationNode.tsx`: Annotation node component
  - `ToolbarNode.tsx`: Toolbar node component
  - `ResizerNode.tsx`: Resizer node component
  - `ButtonEdge.tsx`: Button edge component
  - `initial-elements.tsx`: Initial nodes and edges configuration

## Component Structure

- `NumberInputNode.tsx`: Number input node component
- `CostInputNode.tsx`: Cost input node component
- `CalculationNode.tsx`: Calculation node component
- `JoinNode.tsx`: Join string node component
- `CSVImportNode.tsx`: CSV import node component
- `JsonLoadNode.tsx`: JSON load node component
- `JsonDisplayNode.tsx`: JSON display node component
- `DebugDisplayNode.tsx`: Debug display node component
- `ResultNode.tsx`: Result node component
- `BaseNode.tsx`: Base node component for creating new nodes

## Future Enhancements

This project can be expanded to work with ArchiCAD BIM Element JSON files to create architectural diagrams and visualizations.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Flow Documentation](https://reactflow.dev/docs/introduction/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
