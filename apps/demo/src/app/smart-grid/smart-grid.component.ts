import { AfterViewInit, ChangeDetectorRef, Component, NgZone, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { ColumnMenuSettings, KENDO_GRID, KENDO_GRID_EXCEL_EXPORT, KENDO_GRID_PDF_EXPORT, GridComponent, AIAssistantToolbarDirective } from '@progress/kendo-angular-grid';
import { KENDO_TOOLBAR, ToolBarButtonComponent } from '@progress/kendo-angular-toolbar';
import { arrowRotateCcwIcon, buildingsSolidIcon, moneyExchangeIcon, SVGIcon, walletSolidIcon } from '@progress/kendo-svg-icons';

import { environment } from '../../environments/environment';

import { Customer, customers } from './smart-grid.data';

@Component({
  selector: 'app-smart-grid',
  standalone: true,
  imports: [
    KENDO_GRID,
    KENDO_BUTTONS,
    KENDO_TOOLBAR,
    KENDO_GRID_EXCEL_EXPORT,
    KENDO_GRID_PDF_EXPORT,
    HttpClientModule,
  ],
  providers: [HttpClient],
  template: `
    <kendo-grid
      [kendoGridBinding]="customers"
      [selectable]="true"
      kendoGridSelectBy="Id"
      [(selectedKeys)]="selectedKeys"
      [groupable]="true"
      [sortable]="{ mode: 'multiple' }"
      filterable="menu"
      [reorderable]="true"
      [resizable]="true"
      [pageable]="true"
      [pageSize]="gridPageSize"
      [skip]="gridSkip"
      [sort]="gridSort"
      [filter]="gridFilter"
      [group]="gridGroup"
      [columnMenu]="columnMenuSettings"
    >
      <kendo-toolbar>
        <kendo-toolbar-button
          #aiAssistant
          kendoGridAIAssistantTool
          [keepOutputHistory]="true"
          [aiPromptSettings]="aiPromptSettings"
          [aiWindowSettings]="aiWindowSettings"
          (promptRequest)="onPromptRequest($event)"
          (open)="onAIAssistantOpen($event)"
        ></kendo-toolbar-button>
        <kendo-toolbar-spacer></kendo-toolbar-spacer>
        <kendo-toolbar-button
          (click)="testGitHubToken()"
          text="Test Token"
        ></kendo-toolbar-button>
        <kendo-toolbar-spacer></kendo-toolbar-spacer>
        <kendo-toolbar-button
          (click)="resetChanges()"
          [svgIcon]="resetIcon"
          text="Reset Changes"
        ></kendo-toolbar-button>
      </kendo-toolbar>

      <kendo-grid-column
        field="CustomerName"
        title="Customer Name"
        [width]="160"
      ></kendo-grid-column>
      <kendo-grid-column
        field="Amount"
        [width]="140"
        format="{0:n}"
        filter="numeric"
      >
        <ng-template kendoGridCellTemplate let-dataItem>
          <div
            class="k-text-right"
            [class.k-font-weight-bold]="dataItem.Amount < 0"
          >
            {{ dataItem.Amount }}
          </div>
        </ng-template>
      </kendo-grid-column>
      <kendo-grid-column
        field="Fee"
        [width]="100"
        format="{0:n}"
        filter="numeric"
      >
        <ng-template kendoGridCellTemplate let-dataItem>
          <div class="k-text-right">{{ dataItem.Fee }}</div>
        </ng-template>
      </kendo-grid-column>
      <kendo-grid-column field="Currency" [width]="130"></kendo-grid-column>
      <kendo-grid-column field="Status" [width]="130">
        <ng-template kendoGridCellTemplate let-dataItem>
          <kendo-chip
            [label]="dataItem.Status"
            [themeColor]="
              dataItem.Status === 'Completed'
                ? 'success'
                : dataItem.Status === 'Pending'
                ? 'info'
                : 'error'
            "
          >
          </kendo-chip>
        </ng-template>
      </kendo-grid-column>
      <kendo-grid-column
        field="TransType"
        title="Trans Type"
        [width]="140"
      ></kendo-grid-column>
      <kendo-grid-column field="AccountType" title="Account Type" [width]="140">
        <ng-template kendoGridCellTemplate let-dataItem>
          <kendo-chip
            [label]="dataItem.AccountType"
            fillMode="outline"
            [icon]="
              dataItem.AccountType === 'Business'
                ? 'buildings-solid'
                : dataItem.AccountType === 'Savings'
                ? 'money-exchange'
                : 'wallet-solid'
            "
            [svgIcon]="
              dataItem.AccountType === 'Business'
                ? buildingsSolidIcon
                : dataItem.AccountType === 'Savings'
                ? moneyExchangeIcon
                : walletSolidIcon
            "
          >
          </kendo-chip>
        </ng-template>
      </kendo-grid-column>
      <kendo-grid-column
        field="TransDate"
        title="Trans Date"
        [width]="140"
        format="{0:dd-MM-yy}"
        filter="date"
      ></kendo-grid-column>
      <kendo-grid-column field="Description" [width]="180"></kendo-grid-column>
      <kendo-grid-column field="Region" [width]="120"></kendo-grid-column>

      <kendo-grid-pdf></kendo-grid-pdf>
      <kendo-grid-excel></kendo-grid-excel>
    </kendo-grid>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class SmartGridComponent implements AfterViewInit {
  @ViewChild(GridComponent) public grid!: GridComponent;
  @ViewChild('aiAssistant', { read: AIAssistantToolbarDirective }) public aiAssistantDirective!: AIAssistantToolbarDirective;
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private aiWindow: any = null;
  
  public buildingsSolidIcon: SVGIcon = buildingsSolidIcon;
  public moneyExchangeIcon: SVGIcon = moneyExchangeIcon;
  public walletSolidIcon: SVGIcon = walletSolidIcon;
  public resetIcon: SVGIcon = arrowRotateCcwIcon;

  public customers: Customer[] = customers;
  public selectedKeys: number[] = [];
  private initialState: unknown = null;
  
  // Grid state properties
  public gridPageSize = 10;
  public gridSkip = 0;
  public gridSort: any[] = [];
  public gridFilter: any = undefined;
  public gridGroup: any[] = [];
  
  public aiWindowSettings = {
    width: 500,
  };
  
  public aiPromptSettings = {
    promptSuggestions: [
      'Show only failed transactions',
      'Sort by amount descending',
      'Group by status',
      'Show transactions over 1000',
      'Display 23 records per page'
    ]
  };

  public columnMenuSettings: ColumnMenuSettings = {
    lock: true,
    stick: true,
    setColumnPosition: { expanded: true },
  };

  public ngAfterViewInit(): void {
    // Capture the initial state after the Grid is fully initialized
    setTimeout(() => {
      this.initialState = this.grid.currentState;
    });
  }
  
  public resetChanges(): void {
    if (this.initialState) {
      // Use Grid's built-in state management to restore the initial state
      this.grid.loadState(this.initialState);
      this.selectedKeys = [];
    }
  }

  public testGitHubToken(): void {
    const isOllama = environment.aiProvider === 'ollama';
    const url = isOllama ? environment.ollamaUrl : environment.githubUrl;
    const model = isOllama ? environment.ollamaModel : environment.githubModel;
    
    const testBody = isOllama
      ? {
          model: model,
          messages: [{ role: 'user', content: 'Say hello' }],
          stream: false
        }
      : {
          model: model,
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 10
        };
    
    const headers = isOllama
      ? new HttpHeaders({ 'Content-Type': 'application/json' })
      : new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.githubToken}`
        });
    
    console.log(`Testing ${isOllama ? 'Ollama' : 'GitHub Models'} API...`);
    if (!isOllama) {
      console.log('Token (first 15 chars):', environment.githubToken?.substring(0, 15) + '...');
    }
    console.log('URL:', url);
    console.log('Model:', model);
    
    this.http.post(url, testBody, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ API works! Response:', response);
          if (isOllama) {
            console.log('💬 Ollama says:', response.message?.content);
          } else {
            console.log('💬 AI says:', response.choices?.[0]?.message?.content);
          }
        },
        error: (error: any) => {
          console.error('❌ API test failed:', error);
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
          if (isOllama && error.status === 0) {
            console.error('💡 Is Ollama running? Start with: ollama serve');
          }
        }
      });
  }

  public onAIAssistantOpen(event: any): void {
    console.log('🪟 AI Assistant opened:', event);
    console.log('🪟 Event keys:', Object.keys(event));
    // Store the aiWindow component reference from the event
    this.aiWindow = event.aiWindow || event.window || event.sender || event;
  }

  public onPromptRequest(event: any): void {
    const isOllama = environment.aiProvider === 'ollama';
    const url = isOllama ? environment.ollamaUrl : environment.githubUrl;
    const model = isOllama ? environment.ollamaModel : environment.githubModel;
    
    console.log('🤖 AI Prompt Request:', event.requestData?.promptMessage);
    console.log('🤖 Event keys:', Object.keys(event));
    console.log(`🔧 Using ${isOllama ? 'Ollama' : 'GitHub Models'}:`, model);
    if (!isOllama) {
      console.log('🔑 Token:', environment.githubToken?.substring(0, 10) + '...');
    }
    
    // Get the user's prompt from requestData.promptMessage
    const userPrompt = event.requestData?.promptMessage || '';
    
    if (!userPrompt) {
      console.error('❌ No prompt text found');
      if (typeof event.success === 'function') {
        event.success({ commands: [], message: 'No prompt provided' });
      }
      return;
    }
    
    console.log('📝 Using prompt:', userPrompt);
    
    // Build OpenAI-compatible request (works for both GitHub Models and Ollama)
    const requestBody = isOllama
      ? {
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are a Kendo Grid AI Assistant. You must respond with valid JSON matching the GridAIResponse format.

The response must have this structure:
{
  "commands": [
    { "type": "GridPageSizeCommand", "pageSize": 25 },
    { "type": "GridPageCommand", "page": 1 },
    { "type": "GridFilterCommand", "filter": { "logic": "and", "filters": [{ "field": "Status", "operator": "eq", "value": "Failed" }] } },
    { "type": "GridSortCommand", "sort": [{ "field": "Amount", "dir": "desc" }] },
    { "type": "GridGroupCommand", "group": [{ "field": "Status" }] }
  ],
  "message": "Applied page size change"
}

Available command types:
- GridPageSizeCommand: { "type": "GridPageSizeCommand", "pageSize": number }
- GridPageCommand: { "type": "GridPageCommand", "page": number }
- GridFilterCommand: { "type": "GridFilterCommand", "filter": { "logic": "and|or", "filters": [{...}] } }
- GridSortCommand: { "type": "GridSortCommand", "sort": [{"field": "...", "dir": "asc|desc"}] }
- GridGroupCommand: { "type": "GridGroupCommand", "group": [{"field": "...", "dir": "asc|desc"}] }
- GridClearFilterCommand, GridClearSortCommand, GridClearGroupCommand: { "type": "..." }

IMPORTANT: 
- GridGroupCommand only accepts "field" and optional "dir" ("asc" or "desc"). Do NOT include "operator" or "value" in group objects.
- GridFilterCommand uses "logic" ("and" or "or") and "filters" array with "field", "operator", and "value".
- Valid operators: eq, neq, lt, lte, gt, gte, contains, startswith, endswith

Grid columns: ${JSON.stringify(event.requestData?.columns?.map((c: any) => ({ field: c.field })) || [])}`
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          stream: false
        }
      : {
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are a Kendo Grid AI Assistant. You must respond with valid JSON matching the GridAIResponse format.

The response must have this structure:
{
  "commands": [
    { "type": "GridPageSizeCommand", "pageSize": 25 },
    { "type": "GridPageCommand", "page": 1 },
    { "type": "GridFilterCommand", "filter": { "logic": "and", "filters": [{ "field": "Status", "operator": "eq", "value": "Failed" }] } },
    { "type": "GridSortCommand", "sort": [{ "field": "Amount", "dir": "desc" }] },
    { "type": "GridGroupCommand", "group": [{ "field": "Status" }] }
  ],
  "message": "Applied changes"
}

IMPORTANT: 
- GridGroupCommand only accepts "field" and optional "dir" ("asc" or "desc"). Do NOT include "operator" or "value" in group objects.
- GridFilterCommand uses "logic" ("and" or "or") and "filters" array with "field", "operator", and "value".
- Valid operators: eq, neq, lt, lte, gt, gte, contains, startswith, endswith

Available command types:
- GridPageSizeCommand: { "type": "GridPageSizeCommand", "pageSize": number }
- GridPageCommand: { "type": "GridPageCommand", "page": number }
- GridFilterCommand: { "type": "GridFilterCommand", "filter": { "logic": "and|or", "filters": [{...}] } }
- GridSortCommand: { "type": "GridSortCommand", "sort": [{"field": "...", "dir": "asc|desc"}] }
- GridGroupCommand: { "type": "GridGroupCommand", "group": [{"field": "...", "dir": "asc|desc"}] }
- GridClearFilterCommand, GridClearSortCommand, GridClearGroupCommand: { "type": "..." }

Grid columns: ${JSON.stringify(event.requestData?.columns?.map((c: any) => ({ field: c.field })) || [])}`
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        };
    
    const headers = isOllama
      ? new HttpHeaders({ 'Content-Type': 'application/json' })
      : new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.githubToken}`
        });
    
    console.log(`📤 Sending to ${isOllama ? 'Ollama' : 'GitHub Models'}:`, requestBody);
    
    this.http.post(url, requestBody, { headers })
      .subscribe({
        next: (response: any) => {
          console.log(`✅ ${isOllama ? 'Ollama' : 'GitHub Models'} Response:`, response);
          
          // Extract AI text based on provider
          const aiText = isOllama 
            ? response.message?.content || ''
            : response.choices?.[0]?.message?.content || '';
          console.log('📝 AI Text:', aiText);
          
          try {
            // Try to extract JSON from markdown code blocks if present
            let jsonText = aiText;
            const jsonMatch = aiText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
              jsonText = jsonMatch[1];
            }
            
            // Parse the JSON response from the AI
            const parsed = JSON.parse(jsonText);
            console.log('📊 Parsed commands:', parsed);
            
            // Apply the commands to the grid - this will also close the window
            this.applyAICommands(parsed);
          } catch (e) {
            console.error('❌ Failed to parse AI response:', e);
            console.error('AI returned:', aiText);
          }
        },
        error: (error: any) => {
          console.error('❌ Request failed:', error);
          console.error('❌ Status:', error.status);
          console.error('❌ Status Text:', error.statusText);
          console.error('❌ Error body:', error.error);
          console.error('❌ Full error object:', JSON.stringify(error.error, null, 2));
          
          // Check if it's an auth error
          if (error.status === 401 || error.status === 403) {
            console.error('🔐 Authentication failed. Check your GitHub token at https://github.com/settings/tokens');
          }
          
          // Check if Ollama is not running
          if (isOllama && error.status === 0) {
            console.error('💡 Cannot connect to Ollama. Make sure it\'s running: ollama serve');
            console.error('💡 And that you\'ve pulled the model: ollama pull ' + model);
          }
          
          // Check for specific error messages
          let errorMessage = 'Unknown error occurred';
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.error) {
              errorMessage = error.error.error.message || error.error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          }
          
          console.error('📋 Parsed error message:', errorMessage);
        }
      });
  }

  private applyAICommands(response: any): void {
    const commands = response.commands || [];
    console.log('🎯 Applying commands to grid:', commands);
    
    commands.forEach((cmd: any) => {
      console.log('📌 Command type:', cmd.type, cmd);
      
      switch (cmd.type) {
        case 'GridFilterCommand':
          console.log('🔍 Applying filter:', cmd.filter);
          this.gridFilter = cmd.filter;
          break;
        case 'GridClearFilterCommand':
          console.log('🔍 Clearing filter');
          this.gridFilter = undefined;
          break;
        case 'GridSortCommand':
          console.log('📊 Applying sort:', cmd.sort);
          this.gridSort = cmd.sort;
          break;
        case 'GridClearSortCommand':
          console.log('📊 Clearing sort');
          this.gridSort = [];
          break;
        case 'GridGroupCommand':
          console.log('👥 Applying group:', cmd.group);
          this.gridGroup = cmd.group;
          break;
        case 'GridClearGroupCommand':
          console.log('👥 Clearing group');
          this.gridGroup = [];
          break;
        case 'GridPageCommand':
          console.log('📄 Going to page:', cmd.page);
          this.gridSkip = (cmd.page - 1) * this.gridPageSize;
          break;
        case 'GridPageSizeCommand':
          console.log('📄 Setting page size:', cmd.pageSize);
          this.gridPageSize = cmd.pageSize;
          this.gridSkip = 0; // Reset to first page
          break;
        default:
          console.warn('⚠️ Unknown command type:', cmd.type);
      }
    });
    
    // Force change detection to ensure UI updates
    this.cdr.detectChanges();
    console.log('✅ Commands applied and change detection triggered');
    
    // NOW close the AI window after everything is done
    console.log('🔍 Closing AI window');
    if (this.aiWindow) {
      console.log('✅ aiWindow reference:', this.aiWindow);
      this.zone.run(() => {
        setTimeout(() => {
          // Try to close the window by finding the close button and clicking it
          const windowElement = this.aiWindow.el?.nativeElement;
          if (windowElement) {
            const closeButton = windowElement.querySelector('.k-window-action[aria-label*="lose"]') || 
                              windowElement.querySelector('button[title*="lose"]') ||
                              windowElement.querySelector('.k-window-titlebar-action');
            if (closeButton) {
              console.log('✅ Found close button, dispatching click event');
              // Dispatch a real click event
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              closeButton.dispatchEvent(clickEvent);
              console.log('✅ Click event dispatched');
            } else {
              console.log('⚠️ Close button not found, trying toggleWindow');
              if (this.aiAssistantDirective) {
                this.aiAssistantDirective.toggleWindow();
              }
            }
          }
        }, 200);
      });
    } else {
      console.warn('⚠️ aiWindow is undefined');
    }
  }
}
