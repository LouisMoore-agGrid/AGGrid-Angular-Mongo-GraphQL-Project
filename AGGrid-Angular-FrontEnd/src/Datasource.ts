import {
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  SetFilterValuesFuncParams,
} from 'ag-grid-community';
import {
  ApolloClient,
  gql,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

type rowGroup = {
  aggFunc: string;
  id: string;
  field: string;
  displayName: string;
};

class ServerSideDatasource {
  public client: ApolloClient<NormalizedCacheObject>;
  readonly DATA_SET_SIZE: number;

  constructor() {
    this.client = new ApolloClient({
      uri: 'http://localhost:5000/graphql',
      cache: new InMemoryCache(),
    });
    this.DATA_SET_SIZE = 8617;
  }

  checkIfUndefined = (unknownNum: number | undefined) => {
    return typeof unknownNum === 'undefined';
  };

  makeGQLQueryString = (column: string) => {
    return `
        query GetRows(
            $startRow: Int
            $endRow: Int
            $rowGroups: [RowGroup]
            $groupKeys: JSON
            $sortModel: JSON
            $filterModel: JSON
          ) {
            getRows(
              startRow: $startRow
              endRow: $endRow
              rowGroups: $rowGroups
              groupKeys: $groupKeys
              sortModel: $sortModel
              filterModel: $filterModel
            ){
            rows {
              ${column}
            }
            lastRow
          }
        }
      `;
  };

  getSports(params: SetFilterValuesFuncParams) {
    let startRow: number = 0;
    let endRow: number = this.DATA_SET_SIZE;
    let rowGroups: rowGroup[] = [
      { aggFunc: '', id: 'sport', field: 'sport', displayName: 'Sport' },
    ];
    let groupKeys: string[] = [];
    this.client
      .query({
        query: gql(this.makeGQLQueryString('sport')),
        variables: {
          startRow,
          endRow,
          rowGroups,
          groupKeys,
        },
      })
      .then((res: any) => {
        return res.data.getRows;
      })
      .then(({ rows }: { rows: any[] }) => {
        rows = rows.map((row) => row.sport);
        params.success(rows);
      })
      .catch((err: any) => {
        console.log(JSON.stringify(err, null, 2));
      });
  }

  getRows(params: IServerSideGetRowsParams) {
    console.log('Request', params.request);
    let { groupKeys, sortModel, filterModel }: IServerSideGetRowsRequest =
      params.request;
    let rowGroups = params.request.rowGroupCols;
    let startRow = this.checkIfUndefined(params.request.startRow)
      ? 0
      : params.request.startRow;
    let endRow = this.checkIfUndefined(params.request.endRow)
      ? this.DATA_SET_SIZE
      : params.request.endRow;
    const visibleColumnIds: string[] = params.columnApi
      .getAllGridColumns()
      .map((col) => col.getColId())
      .filter((col) => col !== 'ag-Grid-AutoColumn');
    this.client
      .query({
        query: gql(this.makeGQLQueryString(visibleColumnIds.join('\n'))),
        variables: {
          startRow,
          endRow,
          rowGroups,
          groupKeys,
          sortModel,
          filterModel,
        },
      })
      .then((res: any) => {
        return res.data.getRows;
      })
      .then(({ rows, lastRow }: { rows: any[]; lastRow: number }) => {
        params.success({ rowData: rows, rowCount: lastRow });
      })
      .catch((err: any) => {
        console.log(JSON.stringify(err, null, 2));
        params.fail();
      });
  }
}
export default ServerSideDatasource;
