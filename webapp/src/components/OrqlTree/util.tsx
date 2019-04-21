import {OrqlNode, OrqlExp, OrqlItem, OrqlLogicExp, OrqlLogicOp, OrqlNestExp, OrqlCompareExp, OrqlParam, OrqlValue, OrqlColumn, OrqlNull, OrqlOrder, OrqlAllItem} from 'orql-parser/lib/OrqlNode';
import {SelectItem} from './index';

// orql表达式转string
export function orqlExpToString(orqlExp: OrqlExp): string {
  if (orqlExp instanceof OrqlNestExp) {
    return '(' + orqlExpToString(orqlExp) + ')';
  }
  if (orqlExp instanceof OrqlLogicExp) {
    const left = orqlExpToString(orqlExp.left);
    const op = orqlExp.op == OrqlLogicOp.And ? '&&' : '||';
    const right = orqlExpToString(orqlExp.right);
    return `${left} ${op} ${right}`;
  }
  if (orqlExp instanceof OrqlCompareExp) {
    let exp = orqlExp.left.name;
    exp += ` ${orqlExp.op} `;
    if (orqlExp.right instanceof OrqlParam) {
      exp += '$' + orqlExp.right.name;
    } else if (orqlExp.right instanceof OrqlValue) {
      if (orqlExp.right instanceof OrqlNull) {
        exp += 'null';
      } else {
        exp += orqlExp.right.value.toString();
      }
    } else if (orqlExp.right instanceof OrqlColumn) {
      exp += orqlExp.right.name;
    }
    return exp;
  }
  throw new Error('');
}

// orql orders转string
export function orqlOrdersToString(orders: OrqlOrder[]): string {
  return 'order ' + orders.map(order => `${order.columns.map(column => column.name).join(' ')} ${order.sort}`).join(', ');
}

// select item转orql
export function selectItemToOrql(selectItem: SelectItem): string {
  let orql = selectItem.name;
  orql += getExpAndOrder(selectItem.exp, selectItem.order);
  const childOrqlArr: string[] = [];
  if (selectItem.selectAll) {
    childOrqlArr.push('*');
    childOrqlArr.push(...selectItem.columns.map(column => '!' + column));
  } else {
    childOrqlArr.push(...selectItem.columns);
  }
  childOrqlArr.push(...selectItem.children.map(child => selectItemToOrql(child)));
  if (childOrqlArr.length > 0) {
    const start = selectItem.isArray ? ': [' : ': {';
    const end = selectItem.isArray ? ']' : '}';
    orql += start + childOrqlArr.join(', ') + end;
  }
  return orql;
}

export function getExpAndOrder(exp?: string, order?: string) {
  if (exp && order) return `(${exp} ${order})`;
  if (exp) return `(${exp})`;
  if (order) return `(${order})`;
  return '';
}