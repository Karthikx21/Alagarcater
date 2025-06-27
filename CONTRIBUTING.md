# Contributing to AlgarCatering

Thank you for considering contributing to AlgarCatering! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Git
- Basic knowledge of TypeScript, React, and Express.js

### Setup Development Environment
1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/AlgarCatering.git
   cd AlgarCatering
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style
We use automated tools to maintain code quality:
- **ESLint**: Code linting and error detection
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

#### Before committing:
```bash
npm run lint        # Check for linting errors
npm run format      # Format code
npm run type-check  # Verify TypeScript
npm test           # Run test suite
```

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples:
```bash
git commit -m "feat(auth): add JWT token refresh functionality"
git commit -m "fix(menu): resolve Tamil font rendering issue"
git commit -m "docs: update API documentation"
```

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation
- `refactor/component-name` - Refactoring

## 🧪 Testing

### Test Types
1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Test complete user workflows

### Writing Tests
- Place test files next to the code they test
- Use descriptive test names
- Test both happy paths and edge cases
- Mock external dependencies

#### Example Test:
```typescript
describe('Menu Component', () => {
  it('should display menu items correctly', () => {
    const mockItems = [
      { id: 1, name: 'Biryani', price: 120 }
    ];
    
    render(<MenuComponent items={mockItems} />);
    
    expect(screen.getByText('Biryani')).toBeInTheDocument();
    expect(screen.getByText('₹120')).toBeInTheDocument();
  });
});
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 📝 Documentation

### Code Documentation
- Use JSDoc comments for functions and classes
- Document complex logic and business rules
- Keep README files updated

#### Example:
```typescript
/**
 * Calculates the total price including GST and service charges
 * @param subtotal - The base price before taxes
 * @param serviceChargeRate - Service charge percentage (default: 5%)
 * @param gstRate - GST percentage (default: 18%)
 * @returns Total price including all charges
 */
export function calculateTotal(
  subtotal: number,
  serviceChargeRate = 0.05,
  gstRate = 0.18
): number {
  // Implementation
}
```

### API Documentation
- Document all endpoints in code comments
- Include request/response examples
- Specify authentication requirements

## 🔧 Project Structure

### Frontend (`client/`)
```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configs
├── types/         # TypeScript type definitions
└── assets/        # Static assets
```

### Backend (`server/`)
```
server/
├── routes.ts      # API route definitions
├── auth.ts        # Authentication logic
├── logger.ts      # Logging configuration
├── index.ts       # Server entry point
└── middleware/    # Custom middleware
```

### Shared (`shared/`)
```
shared/
├── schema.ts      # Zod validation schemas
└── types.ts       # Shared TypeScript types
```

## 🐛 Reporting Issues

### Before Creating an Issue
1. Search existing issues to avoid duplicates
2. Check if the issue is already fixed in the latest version
3. Gather relevant information (OS, browser, Node.js version)

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 91]
- Node.js version: [e.g. 20.5.0]
- App version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🔄 Pull Request Process

### Before Submitting
1. **Create a feature branch** from `main`
2. **Write tests** for new functionality
3. **Update documentation** if necessary
4. **Run the full test suite** and ensure it passes
5. **Follow the commit convention**

### PR Guidelines
1. **Clear title and description** explaining the changes
2. **Reference related issues** using keywords (e.g., "Fixes #123")
3. **Include screenshots** for UI changes
4. **Keep PRs focused** - one feature/fix per PR
5. **Respond to feedback** promptly

### PR Template
```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings introduced

## Screenshots (if applicable)
Add screenshots here.

## Related Issues
Fixes #(issue number)
```

## 🏷️ Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Database migrations tested
- [ ] Deployment scripts verified

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different opinions and approaches

### Communication
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code discussions
- **Discussions**: General questions and ideas

## 📚 Learning Resources

### Technologies Used
- **React**: [Official Documentation](https://react.dev/)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/)
- **Express.js**: [Guide](https://expressjs.com/en/guide/routing.html)
- **Prisma**: [Documentation](https://www.prisma.io/docs/)
- **Tailwind CSS**: [Documentation](https://tailwindcss.com/docs)

### Best Practices
- [Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## 💡 Ideas for Contributions

### Good First Issues
- Fix typos in documentation
- Add unit tests for existing components
- Improve error messages
- Add new menu categories
- Enhance accessibility features

### Advanced Contributions
- Performance optimizations
- New authentication providers
- Advanced reporting features
- Mobile app development
- Internationalization improvements

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Annual contributor highlights

---

Thank you for contributing to AlgarCatering! Your efforts help make this project better for everyone in the catering industry.

**Questions?** Feel free to open an issue or start a discussion!
