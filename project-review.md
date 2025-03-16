# ReactFlow Costing App - Project Review

## 1. Project Structure Review

### 1.1 Directory Structure
- [x] App directory organization
  - The project follows Next.js App Router structure with `/src/app` as the main directory
  - Flow-specific pages are organized under `/src/app/flow`
  - Test flow is separated in `/src/app/flow/test`
  - ✅ **ENHANCED**: Created a simplified flow page at `/src/app/flow/simple-page.tsx` to demonstrate core functionality
- [x] Component organization
  - ✅ Components are now organized in subdirectories by type:
    - `/src/components/nodes` for node components
    - `/src/components/edges` for edge components
    - `/src/components/ui` for UI components
  - ✅ Barrel files provide a clean import/export pattern
  - ✅ Improved maintainability with logical grouping
- [x] Utility/helper functions
  - Limited utility functions, mostly contained within components
  - Custom hooks are properly separated in `/src/hooks`
- [x] Static assets
  - No dedicated assets directory found

### 1.2 Component Hierarchy
- [x] Base components
  - `BaseNode.tsx` serves as the foundation for custom nodes
  - `ClientOnlyReactFlow.tsx` handles client-side rendering of React Flow
  - ✅ **RESOLVED**: Fixed "zustand provider as an ancestor" error by ensuring proper ReactFlowProvider usage
  - ✅ **RESOLVED**: Created a simplified version of the flow page to avoid syntax errors in the complex implementation
  - ✅ **ENHANCED**: Added custom node and edge components to the simplified flow page
- [x] Custom node components
  - Multiple specialized node types (NumberInputNode, CostInputNode, CalculationNode, etc.)
  - All node components extend from BaseNode
  - ✅ **ENHANCED**: Added a custom Calculator node to the simplified flow page
- [x] Custom edge components
  - Three edge types: StyledEdge, ButtonEdge, and AnimatedEdge
  - ✅ **ENHANCED**: Added a custom Button edge to the simplified flow page
- [x] UI components
  - Several UI components like NodeSelector, FlowToolbar, HelpPanel, Toast
  - ContextNodeMenu for node-specific actions
  - ✅ **ENHANCED**: Added a custom Toolbar component to the simplified flow page

### 1.3 File Naming Conventions
- [x] Consistency in naming
  - PascalCase consistently used for component files
  - Descriptive names that indicate component purpose
- [x] Component naming patterns
  - Node components follow the pattern `[Type]Node.tsx`
  - Edge components follow the pattern `[Type]Edge.tsx`
  - UI components have descriptive names
- [x] File extensions
  - `.tsx` used for React components
  - `.ts` used for TypeScript utilities and hooks

### 1.4 Import/Export Patterns
- [x] Module import organization
  - React and React Flow imports typically come first
  - Component imports follow
  - ✅ Implemented barrel files for cleaner imports
  - ✅ Components can now be imported from a single location
- [x] Export patterns
  - Default exports used for components
  - Named exports used for utilities and types
  - ✅ Barrel files provide consistent export patterns
  - ✅ Fixed export of initialElements in components/index.ts
- [x] Circular dependencies
  - No obvious circular dependencies detected

### 1.5 Dependency Management
- [x] External dependencies
  - Core dependencies: Next.js 14.1.0, React 18.3.1, @xyflow/react 12.4.4
  - Additional libraries: papaparse for CSV parsing
  - TailwindCSS for styling
  - ✅ **RESOLVED**: Installed missing d3-zoom package required by @xyflow/react
  - ✅ **RESOLVED**: Installed @geist-ui/core package for UI components
- [x] Version management
  - Dependencies have specific versions pinned
  - React and React DOM versions match
- [x] Unused dependencies
  - ✅ **RESOLVED**: The `reactflow` package has been removed from the dependencies, leaving only `@xyflow/react` (v12.4.4)
  - The application now exclusively uses `@xyflow/react`, which is the newer version of the React Flow library (rebranded from `reactflow`)
- [x] Import path management
  - ✅ **RESOLVED**: Fixed import paths in flow components to use relative paths instead of path aliases
  - Path aliases (`@/components/*`) were causing module resolution issues in some environments
  - Relative imports (`../../components/*`) provide more consistent behavior across different environments
- [x] React Flow provider setup
  - ✅ **RESOLVED**: Fixed "zustand provider as an ancestor" error by ensuring proper ReactFlowProvider usage
  - ✅ **RESOLVED**: Implemented proper client-side only rendering for React Flow components to avoid SSR issues
  - ✅ **RESOLVED**: Created a simplified version of the flow page to avoid syntax errors
  - ⚠️ **IMPORTANT**: Double wrapping with `ReactFlowProvider` must be avoided. Always check if a component is already wrapped before adding another provider.

## 2. Custom Node Review

### 2.1 Base Node Implementation
- [x] BaseNode component structure
  - Well-structured component with TypeScript interfaces for type safety
  - Flexible design that accepts various props for customization
  - Supports custom handles, node sizing, and error display
- [x] Common functionality
  - Consistent styling with Tailwind CSS
  - Error handling and display
  - Customizable input and output handles
- [x] Extension patterns
  - Uses composition pattern where specialized nodes include BaseNode
  - Consistent prop passing and data handling

### 2.2 Input Nodes
- [x] NumberInputNode
  - Provides numeric input with increment/decrement buttons
  - Supports min/max constraints and step size
  - Updates node data and propagates changes through the flow
  - Includes unit display
- [x] CostInputNode
  - Specialized input for monetary values
  - Includes currency symbol and formatting
  - Similar update mechanism to NumberInputNode
- [x] Other input nodes
  - Various specialized input nodes for different data types
  - Consistent pattern of local state management and data propagation

### 2.3 Processing Nodes
- [x] CalculationNode
  - Performs mathematical operations (add, subtract, multiply, divide)
  - Handles two inputs and produces a calculated result
  - Includes error handling for division by zero
  - Supports dollar sign formatting for monetary calculations
  - Maintains both formatted and numeric output values
- [x] JoinNode
  - Concatenates string values with a configurable separator
  - Similar pattern to CalculationNode but for string operations
- [x] Other processing nodes
  - JsonParameterFormatter for formatting JSON data
  - MaterialCost for cost calculations based on material properties

### 2.4 Output Nodes
- [x] ResultNode
  - Displays calculation results with formatting
  - Supports units and descriptions
  - Simple design focused on clear presentation of values
- [x] JsonDisplayNode
  - Displays JSON data in various formats
  - Supports raw and formatted output modes
- [x] Other output nodes
  - DebugDisplay for debugging node data
  - Specialized display nodes for different data types

### 2.5 Special Purpose Nodes
- [x] IfcImportNode
  - Handles IFC (Industry Foundation Classes) file imports
  - Specialized for BIM (Building Information Modeling) data
- [x] CSVImportNode
  - Imports and parses CSV data
  - Provides preview of imported data
  - Uses papaparse library for CSV parsing
- [x] Other special purpose nodes
  - JsonLoad for loading JSON data
  - Specialized nodes for domain-specific operations

## 3. Edge Types Review

### 3.1 StyledEdge
- [x] Styling implementation
  - Supports multiple path types: bezier, straight, step, smoothstep
  - Customizable color and stroke width
  - Support for animated edges with dash patterns
- [x] Customization options
  - Edge labels with positioning
  - Animation effects for data flow visualization
  - Consistent styling with the overall UI design

### 3.2 ButtonEdge
- [x] Button functionality
  - Adds a delete button to the middle of the edge
  - Button allows users to remove connections with a single click
  - Improves UX by eliminating the need for context menus or keyboard shortcuts
- [x] Event handling
  - Uses React Flow's `setEdges` to remove the edge when clicked
  - Properly positioned using EdgeLabelRenderer
  - Styled consistently with the application's design system

### 3.3 AnimatedEdge
- [x] Animation implementation
  - Uses CSS animations with keyframes for dash pattern animation
  - Creates a flowing effect along the edge path
  - Visual indication of data flow direction
- [x] Performance considerations
  - Simple CSS-based animation for better performance
  - Minimal DOM manipulation
  - Consistent styling with other edge types

## 4. Calculation Logic Testing

### 4.1 Input Value Changes
- [x] Value update mechanism
  - Input nodes maintain local state and update the global node data
  - Changes trigger recalculation in connected nodes
  - Type conversion handled for different input formats
- [x] Validation
  - Input constraints (min/max) enforced
  - Error handling for invalid inputs
  - Feedback provided to users

### 4.2 Calculation Propagation
- [x] Data flow between nodes
  - Edge connections determine data flow paths
  - Changes in source nodes propagate to target nodes
  - Multiple input handling in calculation nodes
- [x] Update triggers
  - Updates triggered by input changes
  - Edge connection/disconnection triggers recalculation
  - Handles both numeric and string data types

### 4.3 Edge Connection/Disconnection
- [x] Connection handling
  - Uses React Flow's `addEdge` function to create new connections
  - Custom styling applied to new connections
  - Connections trigger calculation updates via `useNodeCalculations` hook
  - Default edge type is set to `StyledEdge` with configurable properties
- [x] Disconnection handling
  - Edge removal handled through ButtonEdge component
  - Disconnection triggers recalculation via `onEdgesChange` callback
  - Custom hook (`useNodeCalculations`) detects changes and updates affected nodes
  - Uses setTimeout to ensure state updates complete before recalculation

## 5. UI/UX Testing

### 5.1 Node Selector
- [x] Available node types
  - Comprehensive selection of node types (12+ types)
  - Organized in a grid layout for easy access
  - Clear labeling of node types
- [x] Addition mechanism
  - Nodes added at viewport center
  - Default configuration applied based on node type
  - Toast notifications confirm node addition
  - Some nodes prompt for additional configuration (e.g., Parameter Formatter)

### 5.2 Node Positioning
- [x] Drag and drop functionality
  - Nodes are draggable by default using React Flow's built-in functionality
  - Position changes are tracked and handled by `onNodesChange` callback
  - Position data is stored in node objects and persists between renders
  - No custom drag and drop implementation needed
- [x] Snap to grid (if applicable)
  - No snap-to-grid functionality implemented
  - Nodes can be positioned freely within the canvas
  - Could be added as a future enhancement using React Flow's `snapToGrid` and `snapGrid` props

### 5.3 Visual Feedback
- [x] Connection feedback
  - Connection lines show path preview during connection creation
  - Custom connection line type (SmoothStep) for better visual appearance
  - Arrow markers indicate connection direction
  - Color coding for different connection types
- [x] Calculation status indicators
  - Error states visually indicated with red borders and text
  - Output handles change color based on error state
  - Animated edges indicate active data flow
  - Result formatting provides visual cues for data types (e.g., currency symbols)

## 6. Error Handling

### 6.1 Invalid Inputs
- [x] Input validation
  - NumberInputNode validates numeric input and prevents NaN values
  - CalculationNode checks for division by zero
  - JsonLoadNode validates JSON file format
  - Type-specific validation in various node types
- [x] Error messaging
  - Error messages displayed within nodes using BaseNode's error display
  - Clear, user-friendly error messages
  - Visual indication with red borders and text
  - Errors don't crash the application but are contained within nodes

### 6.2 Missing Connections
- [x] Required connection handling
  - Nodes check for incoming connections and handle missing inputs gracefully
  - Default values used when connections are missing
  - MaterialCostNode specifically checks for both required inputs
  - No system-wide enforcement of required connections
- [x] Default values
  - Each node type defines sensible defaults
  - Default values applied when connections are missing
  - Consistent pattern across different node types
  - Prevents calculation errors from propagating

### 6.3 Type Mismatches
- [x] Type checking
  - Type conversion handled for different input formats
  - JsonDisplayNode handles different value types (integer, real number, boolean, etc.)
  - CalculationNode extracts numeric values from various input types
  - No strict type system between nodes, relies on runtime conversion
- [x] Conversion handling
  - String-to-number conversion with error handling
  - Special handling for formatted values (e.g., "$4.09" → 4.09)
  - Multiple output value types (formatted and raw) for flexibility
  - Could benefit from more robust type checking system

## 7. Performance Testing

### 7.1 Large Flows
- [x] Rendering performance
  - React.memo is used extensively across node components to prevent unnecessary re-renders
  - Most node components (20+) implement memoization
  - No specific optimizations for large numbers of nodes
  - No virtualization for nodes outside the viewport
- [x] Interaction responsiveness
  - useCallback is used for event handlers in ClientTestFlow and other components
  - Calculation updates are deferred with setTimeout to prevent blocking the UI
  - No debouncing or throttling for frequent updates
  - Could benefit from more aggressive optimization for complex flows

### 7.2 Complex Calculations
- [x] Calculation efficiency
  - useNodeCalculations hook centralizes calculation logic
  - Calculations are triggered only when necessary (on node/edge changes)
  - No memoization of calculation results
  - No caching strategy for expensive calculations
- [x] Update batching
  - Updates are batched using React's state updater functions
  - setTimeout is used to ensure state updates complete before recalculation
  - No explicit use of React.startTransition for non-urgent updates
  - Could benefit from more sophisticated update scheduling

### 7.3 Memory Usage
- [x] Memory leaks
  - No obvious memory leaks in the component lifecycle
  - useEffect cleanup functions are properly implemented
  - No large data structures that grow unbounded
  - No specific memory profiling or optimization
- [x] Resource management
  - File imports (CSV, JSON, IFC) handle resources appropriately
  - No explicit resource cleanup for large data structures
  - LocalStorage used for persisting some node states
  - No specific strategies for managing memory in large flows

## 8. Cross-Browser Testing

### 8.1 Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari

### 8.2 Responsive Design
- [ ] Mobile responsiveness
- [ ] Different screen sizes

## 9. Summary and Recommendations

### 9.1 Strengths
- **Modular Architecture**: The application has a well-structured component hierarchy with the BaseNode component providing a solid foundation for all node types.
- **Comprehensive Node Types**: A wide variety of node types are available for different purposes, from basic inputs to complex calculations.
- **Robust Error Handling**: Each node type implements appropriate error handling and validation.
- **Visual Feedback**: Clear visual feedback is provided for connections, calculations, and errors.
- **Flexible Edge Types**: Custom edge types enhance the visual representation of data flow.
- **Calculation Propagation**: The useNodeCalculations hook efficiently manages data flow between nodes.
- **Modern UI**: Tailwind CSS is used for consistent styling throughout the application.
- **✅ Improved Component Organization**: Components are now organized by type in subdirectories with barrel files for cleaner imports.
- **✅ Enhanced Simplified Flow Page**: Created a simplified flow page with custom nodes, edges, and UI components to demonstrate core functionality.

### 9.2 Areas for Improvement
- **Type Safety**: The application could benefit from stricter type definitions and enforcement in data flow.
- **Performance Optimization**: The application lacks specific optimizations for large flows or complex calculations, which could impact performance as the application scales.
- **Documentation**: There's limited inline documentation explaining the purpose and usage of components, which could make onboarding new developers challenging.
- **Testing**: No evidence of automated testing was found, which could lead to reliability issues as the application evolves.
- **Provider Management**: The application has had issues with double wrapping components with `ReactFlowProvider`, which can cause unexpected behavior.

### 9.3 Recommendations
1. **✅ Refactor Component Organization** (Resolved):
   - ✅ Created subdirectories for different component types (nodes, edges, UI)
   - ✅ Implemented barrel files for cleaner imports
   - ✅ Organized components by type for better maintainability

2. **Enhance Type Safety**:
   - Define stricter interfaces for node data types
   - Implement a type system for connections to ensure compatibility
   - Use discriminated unions for different node types

3. **✅ Dependency Management** (Resolved):
   - ✅ The unused `reactflow` package has been removed
   - ✅ Installed missing d3-zoom package required by @xyflow/react
   - ✅ Installed @geist-ui/core package for UI components
   - Audit and update other dependencies to ensure they're necessary and up-to-date

4. **✅ Import Path Management** (Partially Resolved):
   - ✅ Fixed import paths in flow components to use relative paths instead of path aliases
   - ✅ Fixed export of initialElements in components/index.ts
   - ✅ Created a simplified version of the flow page to avoid syntax errors
   - Continue fixing import paths for remaining components as needed
   - Consider implementing a more robust path alias configuration if needed

5. **✅ React Flow Provider Setup** (Resolved):
   - ✅ Fixed "zustand provider as an ancestor" error
   - ✅ Implemented proper client-side only rendering for React Flow components
   - ✅ Ensured React Flow hooks are only used within ReactFlowProvider context
   - ⚠️ **IMPORTANT**: Always check for existing providers before adding a new one. Double wrapping with `ReactFlowProvider` causes the "zustand provider as an ancestor" error and should be strictly avoided.
   - When modifying components, verify the component hierarchy to ensure there's exactly one `ReactFlowProvider` wrapping components that use React Flow hooks.
   - Use dedicated wrapper components like `ClientReactFlowWithProvider` consistently to avoid provider duplication.

6. **✅ Create Simplified Flow Page** (Resolved):
   - ✅ Created a simplified flow page to demonstrate core functionality
   - ✅ Added custom node and edge components to the simplified flow page
   - ✅ Added a custom toolbar component to the simplified flow page
   - ✅ Implemented basic calculation logic between nodes
   - Use this simplified page as a foundation for gradually reintroducing complex functionality

7. **Improve Performance**:
   - Implement memoization for expensive calculations
   - Add virtualization for large flows
   - Optimize render cycles with React.memo and useCallback

8. **Add Documentation**:
   - Add JSDoc comments to components and functions
   - Create a README with usage examples
   - Document the data flow architecture

9. **Implement Testing**:
   - Add unit tests for individual components
   - Create integration tests for node interactions
   - Set up end-to-end tests for complete flows

10. **Enhance User Experience**:
    - Add snap-to-grid functionality for easier node positioning
    - Implement undo/redo functionality
    - Add keyboard shortcuts for common actions

11. **Improve Error Handling**:
    - Implement a centralized error tracking system
    - Add more specific error messages for different scenarios
    - Create a user-friendly error recovery mechanism

12. **Consider Accessibility**:
    - Ensure the application is keyboard navigable
    - Add ARIA attributes for screen readers
    - Improve color contrast for better readability 

## 10. Node Integration Standards

This section defines standards for integrating nodes into the application, ensuring consistency across both new and existing node components. These standards should be followed when creating new nodes or refactoring existing ones.

### 10.1 Node Structure and Naming Conventions

#### 10.1.1 File Organization
- [ ] Node components should be placed in the `/src/components/nodes` directory
- [ ] Node components should be named using PascalCase with the suffix `Node` (e.g., `CalculationNode.tsx`)
- [ ] Each node should have its own directory if it requires additional helper components or styles
- [ ] Node-specific types should be defined in a separate `types.ts` file within the node's directory

#### 10.1.2 Component Structure
- [ ] All nodes should extend the `BaseNode` component or implement its interface
- [ ] Nodes should use React.memo for performance optimization
- [ ] Nodes should implement proper cleanup in useEffect hooks
- [ ] Nodes should have clear separation between UI rendering and business logic

### 10.2 Port Standardization

#### 10.2.1 Input Port Naming
- [ ] Input ports should follow the naming convention: `input_[dataType]_[purpose]`
  - Example: `input_number_value1`, `input_string_name`, `input_object_parameters`
- [ ] For nodes with multiple similar inputs, use numeric suffixes (e.g., `input_number_value1`, `input_number_value2`)
- [ ] Special purpose inputs should use descriptive names (e.g., `input_number_quantity`, `input_number_unitPrice`)

#### 10.2.2 Output Port Naming
- [ ] Output ports should follow the naming convention: `output_[dataType]_[purpose]`
  - Example: `output_number_result`, `output_string_formatted`, `output_object_processed`
- [ ] Nodes with multiple outputs should use descriptive suffixes (e.g., `output_number_sum`, `output_number_average`)
- [ ] Formatted outputs should include `formatted` in the name (e.g., `output_string_formatted`)

#### 10.2.3 Port Positioning
- [ ] Input ports should be positioned on the left side of the node
- [ ] Output ports should be positioned on the right side of the node
- [ ] Multiple ports should be evenly spaced
- [ ] Port positions should be consistent across similar node types

#### 10.2.4 Multiple Port Management
- [ ] Nodes with multiple input ports of the same type should:
  - Use consistent naming with clear differentiation (e.g., `input_number_operand1`, `input_number_operand2`)
  - Visually indicate the purpose of each port through labels or icons
  - Document the expected data format for each port
  - Maintain consistent positioning across similar node types (e.g., first operand always at the top)

- [ ] Nodes with multiple output ports should:
  - Clearly differentiate between primary and secondary outputs
  - Use descriptive names that indicate the relationship between outputs (e.g., `output_number_raw`, `output_string_formatted`)
  - Document the data format and purpose of each output
  - Consider color-coding or visual indicators for different output types

- [ ] For complex nodes with many ports:
  - Group related ports visually (e.g., all numeric inputs together)
  - Consider collapsible port groups for rarely used ports
  - Provide clear visual indicators of required vs. optional ports
  - Implement tooltips or hover information explaining each port's purpose

- [ ] Port limits and guidelines:
  - Nodes should generally have no more than 5 input ports to maintain usability
  - If more inputs are required, consider using array/object inputs or creating specialized node variants
  - Output ports should be limited to those that provide meaningful distinct data
  - Dynamic ports (user can add/remove) should follow the same naming conventions with added index

### 10.3 Data Type Standards

#### 10.3.1 Supported Data Types
- [ ] Numeric: Integer and floating-point values
- [ ] String: Text values, including formatted numbers
- [ ] Boolean: True/false values
- [ ] Object: JSON objects or structured data
- [ ] Array: Lists of values
- [ ] Special: Domain-specific types (e.g., IFC data, CSV data)

#### 10.3.2 Type Conversion
- [ ] Nodes should clearly document expected input types
- [ ] Nodes should handle type conversion gracefully with appropriate error messages
- [ ] Type conversion should be consistent across similar node types
- [ ] Nodes should validate input types before processing

#### 10.3.3 Data Formatting
- [ ] Numeric outputs should maintain both raw and formatted values
- [ ] Currency values should use consistent formatting (e.g., `$1,234.56`)
- [ ] Percentage values should include the % symbol (e.g., `42%`)
- [ ] Date/time values should use ISO format internally with configurable display format
- [ ] Units should be consistently applied and displayed

### 10.4 Error Handling Standards

#### 10.4.1 Input Validation
- [ ] Nodes should validate all inputs before processing
- [ ] Invalid inputs should trigger clear error states
- [ ] Required inputs should be clearly marked
- [ ] Validation should include type checking, range checking, and format validation

#### 10.4.2 Error Display
- [ ] Errors should be displayed within the node using the BaseNode error display
- [ ] Error messages should be user-friendly and actionable
- [ ] Critical errors should be visually distinct from warnings
- [ ] Errors should not crash the application but be contained within the node

### 10.5 Performance Considerations

#### 10.5.1 Calculation Efficiency
- [ ] Nodes should use memoization for expensive calculations
- [ ] Nodes should only recalculate when inputs change
- [ ] Nodes should use efficient algorithms for complex operations
- [ ] Nodes should handle large datasets gracefully

#### 10.5.2 Render Optimization
- [ ] Nodes should use React.memo to prevent unnecessary re-renders
- [ ] Nodes should use useCallback for event handlers
- [ ] Nodes should minimize state updates during user interactions
- [ ] Nodes should avoid expensive operations during rendering

### 10.6 Pre-Deployment Checklist

Before integrating a new node or updating an existing one, verify the following:

#### 10.6.1 Structure and Naming
- [ ] Node follows file organization standards
- [ ] Node extends BaseNode or implements its interface
- [ ] Node uses consistent naming conventions
- [ ] Node is properly exported in the barrel file

#### 10.6.2 Ports and Data Flow
- [ ] Input ports follow naming conventions
- [ ] Output ports follow naming conventions
- [ ] Ports are positioned correctly
- [ ] Data flow between ports is documented

#### 10.6.3 Data Handling
- [ ] Node handles all supported data types correctly
- [ ] Type conversion is implemented consistently
- [ ] Data formatting follows standards
- [ ] Node maintains both raw and formatted values where appropriate

#### 10.6.4 Error Handling
- [ ] Input validation is implemented
- [ ] Error states are displayed correctly
- [ ] Required inputs are marked
- [ ] Edge cases are handled gracefully

#### 10.6.5 Performance
- [ ] Node uses memoization for expensive calculations
- [ ] Node prevents unnecessary re-renders
- [ ] Node handles large datasets efficiently
- [ ] Node cleans up resources properly

#### 10.6.6 Testing
- [ ] Node has unit tests for core functionality
- [ ] Node has integration tests with connected nodes
- [ ] Edge cases are tested
- [ ] Performance is benchmarked for complex operations

### 10.7 AI Assistant Integration Guidelines

To ensure the AI assistant consistently follows these standards when building or modifying nodes:

#### 10.7.1 Context Initialization
- Before starting work on a node, the AI should review:
  - The Node Integration Standards section of this document
  - The BaseNode implementation
  - Similar existing nodes for reference
  - The specific requirements for the new node

#### 10.7.2 Implementation Process
1. The AI should first outline the node structure, including:
   - Input and output ports with standardized names
   - Data types and conversions
   - Core functionality
   - Error handling approach

2. The AI should implement the node following the standards, with particular attention to:
   - Consistent port naming and positioning
   - Proper extension of BaseNode
   - Efficient calculation and rendering
   - Comprehensive error handling

3. The AI should validate the implementation against the pre-deployment checklist

#### 10.7.3 Documentation Requirements
- The AI should document:
  - The purpose and functionality of the node
  - Expected input types and formats
  - Output types and formats
  - Error states and handling
  - Performance considerations
  - Usage examples

#### 10.7.4 Review Process
- After implementation, the AI should review the node against all standards
- The AI should identify any deviations from standards and explain the rationale
- The AI should suggest improvements to align with standards where possible

By following these guidelines, the AI assistant can ensure that all nodes it creates or modifies conform to the project's standards and integrate seamlessly with the existing codebase. 