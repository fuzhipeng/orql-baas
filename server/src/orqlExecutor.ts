import OrqlExecutor from 'orql-executor';
import {config, schemas} from './config';
import {Columns} from 'orql-executor/lib/SchemaManager';

const orqlExecutor = new OrqlExecutor(config.orql);

schemas.forEach(schema => {
  const columns: Columns = {};
  schema.columns.forEach(column => {
    columns[column.name] = column;
  });
  schema.associations.forEach(association => {
    columns[association.name] = association;
  });
  orqlExecutor.addSchema(schema.name, columns);
});

export default orqlExecutor;