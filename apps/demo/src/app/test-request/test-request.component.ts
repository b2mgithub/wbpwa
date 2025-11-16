import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_INDICATORS } from '@progress/kendo-angular-indicators';
import { firstValueFrom } from 'rxjs';

import { toPacificDateTimeOffset } from '@devils-offline/datetime-offset';
import { devilsOfflineDB, FailedRequest } from '@devils-offline/idb';

@Component({
  selector: 'app-test-request',
  imports: [CommonModule, KENDO_BUTTONS, KENDO_GRID, KENDO_ICONS, KENDO_INDICATORS],
  templateUrl: './test-request.component.html',
})
export class TestRequestComponent implements OnInit {
  private http = inject(HttpClient);
  
  public failedRequests = signal<FailedRequest[]>([]);
  public loading = signal<boolean>(false);
  public testResults = signal<string[]>([]);

  async ngOnInit() {
    await this.loadFailedRequests();
  }

  async loadFailedRequests() {
    this.loading.set(true);
    try {
      const requests = await devilsOfflineDB.readFailedRequests();
      this.failedRequests.set(requests);
      this.addTestResult(`📋 Loaded ${requests.length} failed requests`);
    } catch (error) {
      this.addTestResult(`❌ Error loading failed requests: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  formatTimestamp(timestamp: number): string {
    return toPacificDateTimeOffset(new Date(timestamp));
  }

  getMethodColor(method: string): 'success' | 'warning' | 'error' | 'base' {
    switch (method) {
      case 'POST': return 'success';
      case 'PATCH': return 'warning';
      case 'DELETE': return 'error';
      default: return 'base';
    }
  }

  async retryRequest(request: FailedRequest) {
    this.addTestResult(`🔄 Retrying ${request.operation} for product ${request.productId}...`);
    
    try {
      if (request.method === 'POST') {
        await firstValueFrom(this.http.post(request.url, request.body));
      } else if (request.method === 'PATCH') {
        await firstValueFrom(this.http.patch(request.url, request.body));
      } else if (request.method === 'DELETE') {
        await firstValueFrom(this.http.delete(request.url));
      }
      
      await devilsOfflineDB.removeFailedRequest(request.id);
      this.addTestResult(`✅ Successfully retried ${request.operation} for product ${request.productId}`);
      await this.loadFailedRequests();
    } catch (error) {
      this.addTestResult(`❌ Retry failed for ${request.operation} on product ${request.productId}: ${error}`);
      
      // Increment retry count
      request.retryCount++;
      await devilsOfflineDB.updateFailedRequest(request);
      await this.loadFailedRequests();
    }
  }

  async retryAllRequests() {
    this.addTestResult(`🔄 Retrying all ${this.failedRequests().length} failed requests...`);
    
    const requests = [...this.failedRequests()];
    let successCount = 0;
    let failCount = 0;
    
    for (const request of requests) {
      try {
        if (request.method === 'POST') {
          await firstValueFrom(this.http.post(request.url, request.body));
        } else if (request.method === 'PATCH') {
          await firstValueFrom(this.http.patch(request.url, request.body));
        } else if (request.method === 'DELETE') {
          await firstValueFrom(this.http.delete(request.url));
        }
        
        await devilsOfflineDB.removeFailedRequest(request.id);
        successCount++;
      } catch {
        request.retryCount++;
        await devilsOfflineDB.updateFailedRequest(request);
        failCount++;
      }
    }
    
    this.addTestResult(`✅ Retry complete: ${successCount} succeeded, ${failCount} failed`);
    await this.loadFailedRequests();
  }

  async deleteRequest(request: FailedRequest) {
    this.addTestResult(`🗑️ Deleting failed request ${request.id}...`);
    
    try {
      await devilsOfflineDB.removeFailedRequest(request.id);
      this.addTestResult(`✅ Deleted request ${request.id}`);
      await this.loadFailedRequests();
    } catch (error) {
      this.addTestResult(`❌ Error deleting request: ${error}`);
    }
  }

  async clearAllRequests() {
    this.addTestResult(`🗑️ Clearing all ${this.failedRequests().length} failed requests...`);
    
    try {
      const requests = [...this.failedRequests()];
      for (const request of requests) {
        await devilsOfflineDB.removeFailedRequest(request.id);
      }
      this.addTestResult(`✅ Cleared ${requests.length} failed requests`);
      await this.loadFailedRequests();
    } catch (error) {
      this.addTestResult(`❌ Error clearing requests: ${error}`);
    }
  }

  clearTestResults() {
    this.testResults.set([]);
  }

  private addTestResult(message: string) {
    const timestamp = toPacificDateTimeOffset(new Date());
    this.testResults.update(results => [...results, `[${timestamp}] ${message}`]);
  }
}
