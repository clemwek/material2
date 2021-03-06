/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  IterableDiffer,
  IterableDiffers,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import {CdkCellDef} from './cell';
import {Subject} from 'rxjs/Subject';

/**
 * The row template that can be used by the md-table. Should not be used outside of the
 * material library.
 */
export const CDK_ROW_TEMPLATE = `<ng-container cdkCellOutlet></ng-container>`;

/**
 * Base class for the CdkHeaderRowDef and CdkRowDef that handles checking their columns inputs
 * for changes and notifying the table.
 */
export abstract class BaseRowDef {
  /** The columns to be displayed on this row. */
  columns: string[];

  /** Event stream that emits when changes are made to the columns. */
  columnsChange: Subject<void> = new Subject<void>();

  /** Differ used to check if any changes were made to the columns. */
  protected _columnsDiffer: IterableDiffer<any>;

  private viewInitialized = false;

  constructor(public template: TemplateRef<any>,
              protected _differs: IterableDiffers) { }

  ngAfterViewInit() {
    this.viewInitialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Create a new columns differ if one does not yet exist. Initialize it based on initial value
    // of the columns property.
    if (!this._columnsDiffer && changes['columns'].currentValue) {
      this._columnsDiffer = this._differs.find(changes['columns'].currentValue).create();
    }
  }

  ngDoCheck(): void {
    if (!this.viewInitialized || !this._columnsDiffer || !this.columns) { return; }

    // Notify the table if there are any changes to the columns.
    const changes = this._columnsDiffer.diff(this.columns);
    if (changes) { this.columnsChange.next(); }
  }
}

/**
 * Header row definition for the CDK table.
 * Captures the header row's template and other header properties such as the columns to display.
 */
@Directive({
  selector: '[cdkHeaderRowDef]',
  inputs: ['columns: cdkHeaderRowDef'],
})
export class CdkHeaderRowDef extends BaseRowDef {
  constructor(template: TemplateRef<any>, _differs: IterableDiffers) {
    super(template, _differs);
  }
}

/**
 * Data row definition for the CDK table.
 * Captures the header row's template and other row properties such as the columns to display.
 */
@Directive({
  selector: '[cdkRowDef]',
  inputs: ['columns: cdkRowDefColumns'],
})
export class CdkRowDef extends BaseRowDef {
  // TODO(andrewseguin): Add an input for providing a switch function to determine
  //   if this template should be used.
  constructor(template: TemplateRef<any>, _differs: IterableDiffers) {
    super(template, _differs);
  }
}

/** Context provided to the row cells */
export interface CdkCellOutletRowContext<T> {
  /** Data for the row that this cell is located within. */
  $implicit: T;

  /** Index location of the row that this cell is located within. */
  index?: number;

  /** Length of the number of total rows. */
  count?: number;

  /** True if this cell is contained in the first row. */
  first?: boolean;

  /** True if this cell is contained in the last row. */
  last?: boolean;

  /** True if this cell is contained in a row with an even-numbered index. */
  even?: boolean;

  /** True if this cell is contained in a row with an odd-numbered index. */
  odd?: boolean;
}

/**
 * Outlet for rendering cells inside of a row or header row.
 * @docs-private
 */
@Directive({selector: '[cdkCellOutlet]'})
export class CdkCellOutlet {
  /** The ordered list of cells to render within this outlet's view container */
  cells: CdkCellDef[];

  /** The data context to be provided to each cell */
  context: any;

  /**
   * Static property containing the latest constructed instance of this class.
   * Used by the CDK table when each CdkHeaderRow and CdkRow component is created using
   * createEmbeddedView. After one of these components are created, this property will provide
   * a handle to provide that component's cells and context. After init, the CdkCellOutlet will
   * construct the cells with the provided context.
   */
  static mostRecentCellOutlet: CdkCellOutlet;

  constructor(public _viewContainer: ViewContainerRef) {
    CdkCellOutlet.mostRecentCellOutlet = this;
  }
}

/** Header template container that contains the cell outlet. Adds the right class and role. */
@Component({
  selector: 'cdk-header-row',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'cdk-header-row',
    'role': 'row',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CdkHeaderRow { }

/** Data row template container that contains the cell outlet. Adds the right class and role. */
@Component({
  selector: 'cdk-row',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'cdk-row',
    'role': 'row',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CdkRow { }
