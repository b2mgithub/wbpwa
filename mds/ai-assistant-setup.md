# AI Assistant Setup Guide

## GitHub Models Integration

The products grid now has an AI Assistant powered by GitHub Models API.

### Setup Steps

1. **Get a GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - **No specific scopes required** for GitHub Models access
   - Copy the generated token (starts with `github_pat_`)

2. **Add Token to Environment**
   - Open: `apps/demo/src/environments/environment.ts`
   - Replace `github_pat_YOUR_TOKEN_HERE` with your actual token
   - Also update `environment.prod.ts` if deploying to production

3. **Test the AI Assistant**
   - Navigate to the Products grid
   - Click the AI Assistant button in the toolbar
   - Try natural language commands like:
     - "Show only products with price greater than 50"
     - "Sort by product name descending"
     - "Group products by category"
     - "Hide the stock column"
     - "Export to Excel"

### How It Works

**Architecture:**
```
User Prompt → Kendo AI Assistant
    ↓
GitHub Models API (GPT-4)
    ↓
Grid Commands (filter, sort, group, etc.)
    ↓
Grid Updated
```

**Request Flow:**
1. User types natural language in AI prompt window
2. Kendo sends request to `https://models.inference.ai.azure.com/chat/completions`
3. GitHub Models processes the prompt with grid context (columns, data structure)
4. Returns structured commands (filter, sort, group operations)
5. Kendo automatically applies commands to the grid

**Configuration:**
```typescript
// In products.grid.ts
public aiRequestUrl = 'https://models.inference.ai.azure.com/chat/completions';
public aiRequestOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${environment.githubToken}`
  }
};
```

### Supported Operations

| Category | Operations |
|----------|-----------|
| **Data** | Filter, Sort, Group, Paging |
| **Columns** | Resize, Reorder, Show/Hide, Lock/Unlock |
| **Selection** | Row/Cell Selection, Highlighting |
| **Export** | Excel, PDF |

### Event Handlers

```typescript
onPromptRequest(event)    // Before AI request sent
onResponseSuccess(event)  // After successful AI response
onResponseError(event)    // If AI request fails
```

### Troubleshooting

**Error: 401 Unauthorized**
- Check that your GitHub token is valid
- Token should start with `github_pat_`
- No scopes required for GitHub Models

**Error: 404 Not Found**
- Verify endpoint URL is correct
- GitHub Models endpoint: `https://models.inference.ai.azure.com/chat/completions`

**AI doesn't understand prompt**
- Be specific about column names (use exact names from grid)
- Use clear action words: "filter", "sort", "group", "show", "hide"
- Try simpler commands first

**No response from AI**
- Check browser console for errors
- Verify network connectivity
- Check GitHub Models service status

### Example Prompts

**Filtering:**
- "Show products where price is less than 100"
- "Filter by category Beverages"
- "Show discontinued products"

**Sorting:**
- "Sort by unit price descending"
- "Order by product name alphabetically"

**Grouping:**
- "Group by category"
- "Group products by supplier"

**Column Management:**
- "Hide the ProductId column"
- "Show only name and price columns"
- "Resize product name column to 300px"

**Export:**
- "Export to Excel"
- "Export grid to PDF"

### Security Notes

**DO NOT commit your GitHub token to version control!**

Add to `.gitignore`:
```
# Environment files with tokens
apps/demo/src/environments/environment.ts
apps/demo/src/environments/environment.prod.ts
```

Or use environment variables in CI/CD:
```typescript
githubToken: process.env['GITHUB_TOKEN'] || 'github_pat_YOUR_TOKEN_HERE'
```

### Cost Considerations

- GitHub Models provides **free tier** for personal use
- Rate limits apply (check GitHub documentation)
- No credit card required for basic access
- Perfect for development and small-scale production

### Extending to Other Grids

To add AI Assistant to other grids (blocks, rates, productions):

1. **Import required modules:**
```typescript
import { AIAssistantToolbarDirective } from '@progress/kendo-angular-grid';
import { KENDO_TOOLBAR } from '@progress/kendo-angular-toolbar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
```

2. **Add toolbar button:**
```html
<kendo-toolbar-button 
  kendoGridAIAssistantTool
  [requestUrl]="aiRequestUrl"
  [requestOptions]="aiRequestOptions">
</kendo-toolbar-button>
```

3. **Add configuration:**
```typescript
public aiRequestUrl = 'https://models.inference.ai.azure.com/chat/completions';
public aiRequestOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${environment.githubToken}`
  })
};
```

### Alternative AI Services

If you want to use a different AI service instead of GitHub Models:

**Azure OpenAI:**
```typescript
aiRequestUrl = 'https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-MODEL/chat/completions?api-version=2024-02-15-preview';
aiRequestOptions = {
  headers: {
    'api-key': environment.azureOpenAIKey
  }
};
```

**Custom Backend:**
```typescript
aiRequestUrl = 'http://localhost:3000/api/grid-ai';
// Your backend receives grid context and returns Kendo grid commands
```

### Resources

- [Kendo AI Assistant Documentation](https://www.telerik.com/kendo-angular-ui/components/grid/smart-grid/ai-toolbar-tool)
- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [Get GitHub Token](https://github.com/settings/tokens)
- [Kendo Grid AI Examples](https://www.telerik.com/kendo-angular-ui/components/grid/smart-grid)

---

**Status:** ✅ Implemented in Products Grid  
**Date:** November 17, 2025  
**Integration:** GitHub Models (Automatic)
