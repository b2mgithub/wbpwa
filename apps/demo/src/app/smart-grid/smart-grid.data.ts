export interface Customer {
  Id: number;
  CustomerName: string;
  Amount: number;
  Fee: number;
  Currency: string;
  Status: string;
  TransType: string;
  AccountType: string;
  TransDate: Date;
  Description: string;
  Region: string;
}

function generateCustomers(count: number): Customer[] {
  const names = [
    'Emma Johnson',
    'Lucas Brown',
    'Olivia King',
    'Isabella Lee',
    'Mia Davis',
    'Ethan Wilson',
    'Sophia Turner',
    'Noah Smith',
    'James Miller',
    'Charlotte Wilson',
  ];
  const currencies = ['USD', 'EUR'];
  const statuses = ['Completed', 'Pending', 'Failed'];
  const transTypes = ['Deposit', 'Withdrawal', 'Transfer'];
  const accountTypes = ['Checking', 'Savings', 'Business'];
  const descriptions = [
    'Paycheck Deposit',
    'Bank Withdrawal',
    'Failed ATM Withdrawal',
    'Supplier Payment',
    'Counter Withdrawal',
    'Direct Deposit',
    'Online Transfer',
    'Invoice Payment',
    'ATM Withdrawal',
    'Bonus Deposit',
  ];
  const regions = ['East', 'West', 'North', 'South'];

  const customers: Customer[] = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    const transDate = date;

    const name = `${names[Math.floor(Math.random() * names.length)]}`;
    customers.push({
      Id: i,
      CustomerName: name,
      Amount: Math.round((Math.random() * 4000 - 2000) * 100) / 100,
      Fee: Math.round(Math.random() * 12 * 100) / 100,
      Currency: currencies[i % currencies.length],
      Status: statuses[i % statuses.length],
      TransType: transTypes[i % transTypes.length],
      AccountType: accountTypes[i % accountTypes.length],
      TransDate: transDate,
      Description: descriptions[i % descriptions.length],
      Region: regions[i % regions.length],
    });
  }
  return customers;
}

export const customers = generateCustomers(1000);

export const addColumnsValues = (columns: any[]) => {
  return columns.map((col) => {
    if (col.field === 'Currency') {
      return {
        ...col,
        Values: ['USD', 'EUR'],
      };
    }
    if (col.field === 'Status') {
      return {
        ...col,
        Values: ['Completed', 'Pending', 'Failed'],
      };
    }
    if (col.field === 'TransType') {
      return {
        ...col,
        Values: ['Deposit', 'Withdrawal', 'Transfer'],
      };
    }
    if (col.field === 'AccountType') {
      return {
        ...col,
        Values: ['Checking', 'Savings', 'Business'],
      };
    }
    if (col.field === 'Region') {
      return {
        ...col,
        Values: ['East', 'West', 'North', 'South'],
      };
    }
    return col;
  });
};
