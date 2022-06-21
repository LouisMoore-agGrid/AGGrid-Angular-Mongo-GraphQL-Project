import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import 'ag-grid-enterprise';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css';
import Datasource from '../Datasource';
import {
  ColDef,
  GetServerSideStoreParamsParams,
  GridOptions,
  GridReadyEvent,
  ServerSideStoreParams,
  ServerSideStoreType,
  SetFilterValuesFuncParams,
} from 'ag-grid-community';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public columnDefs: ColDef[];
  public rowData: {}[];
  public rowModelType: 'clientSide' | 'infinite' | 'viewport' | 'serverSide';
  public gridOptions: GridOptions;
  public serverSideStoreType: ServerSideStoreType;
  public autoGroupColumnDef: ColDef;
  public getServerSideStoreParams: (
    params: GetServerSideStoreParamsParams
  ) => ServerSideStoreParams;
  public defaultColDef: ColDef;
  private server: Datasource;

  constructor(private http: HttpClient) {
    this.server = new Datasource();
    this.columnDefs = [
      { field: 'athlete', filter: 'agTextColumnFilter' },
      { field: 'country', rowGroup: true, hide: true },
      {
        field: 'sport',
        filter: true,
        filterParams: {
          values: this.getSportsAsync,
        },
      },
      { field: 'age', filter: 'agNumberColumnFilter' },
      { field: 'year' },
      { field: 'date' },
      { field: 'gold' },
      { field: 'silver' },
      { field: 'bronze' },
      { field: 'total' },
    ];
    this.autoGroupColumnDef = {
      flex: 1,
      minWidth: 280,
    };
    this.defaultColDef = {
      sortable: true,
    };
    this.gridOptions = {};
    this.rowData = [];
    this.rowModelType = 'serverSide';
    this.serverSideStoreType = 'full';
    this.getServerSideStoreParams = (
      params: GetServerSideStoreParamsParams
    ) => {
      var res: ServerSideStoreParams;
      var topLevelRows = params.level == 0;
      res = {
        storeType: topLevelRows ? 'full' : 'partial',
        cacheBlockSize: params.level == 1 ? 5 : 2,
        maxBlocksInCache: -1,
      };
      console.log('############## NEW STORE ##############');
      console.log(
        'getServerSideStoreParams, level = ' +
          params.level +
          ', result = ' +
          JSON.stringify(res)
      );
      return res;
    };
  }

  getSportsAsync = (params: SetFilterValuesFuncParams) => {
    return this.server.getSports(params);
  };

  onGridReady(params: GridReadyEvent) {
    params.api.setServerSideDatasource(this.server);
  }
}
