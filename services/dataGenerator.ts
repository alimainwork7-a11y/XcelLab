
import { DatasetType, ColumnDefinition, DataRow, DifficultyLevel, MessyConfig } from '../types';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow'];
const NAMES = ['Amit Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Gupta', 'Vikram Singh', 'Ananya Reddy', 'Suresh Kumar', 'Kavita Devi', 'Rajesh Iyer', 'Meera Nair'];
const DEPTS = ['HR', 'Finance', 'Engineering', 'Marketing', 'Sales', 'Operations'];
const PRODUCTS = ['Laptop Pro', 'Wireless Mouse', 'Mechanical Keyboard', '4K Monitor', 'USB-C Hub', 'Ergonomic Chair'];
const HOSPITALS = ['City General', 'Metro Health', 'Sunrise Clinic', 'Unity Hospital'];
const CATEGORIES = ['Railways', 'Non-Railways', 'Staff', 'Corporate'];

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const applyMessiness = (value: any, config: MessyConfig): any => {
  if (value === null) return null;
  let newValue = value;

  // Wrong data types
  if (config.wrongTypes && Math.random() * 100 < 5) {
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string' && !isNaN(Number(value))) return Number(value);
  }

  if (typeof newValue === 'string') {
    if (config.extraSpaces && Math.random() * 100 < 30) {
      newValue = Math.random() < 0.5 ? `  ${newValue}` : `${newValue}   `;
    }
    if (config.mixedCasing && Math.random() * 100 < 20) {
      newValue = Math.random() < 0.5 ? newValue.toUpperCase() : newValue.toLowerCase();
    }
    if (config.invalidFormats && Math.random() * 100 < 5) {
      if (newValue.includes('@')) newValue = newValue.replace('@', ' (at) ');
    }
  }

  return newValue;
};

const generateValue = (col: ColumnDefinition, config: MessyConfig): any => {
  if (Math.random() * 100 < config.missingPct) return null;

  let value: any;
  switch (col.type) {
    case 'string': value = getRandomElement(NAMES); break;
    case 'number': 
      const min = col.range?.min ?? 1;
      const max = col.range?.max ?? 1000;
      value = Math.floor(Math.random() * (max - min + 1)) + min; 
      break;
    case 'city': value = getRandomElement(CITIES); break;
    case 'category': value = getRandomElement(col.options || CATEGORIES); break;
    case 'currency': value = parseFloat((Math.random() * 50000 + 1000).toFixed(2)); break;
    case 'email': value = `${getRandomElement(NAMES).toLowerCase().replace(' ', '.')}@example.com`; break;
    case 'date': 
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 730)); // Last 2 years
      value = d.toISOString().split('T')[0];
      break;
    case 'boolean': value = Math.random() > 0.5 ? 'Active' : 'Inactive'; break;
    case 'subject_mark': value = Math.floor(Math.random() * 101); break;
    default: value = 'N/A';
  }

  return applyMessiness(value, config);
};

export const generateDataset = (
  rowCount: number,
  columns: ColumnDefinition[],
  config: MessyConfig,
  type: DatasetType
): DataRow[] => {
  const data: DataRow[] = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row: DataRow = {};
    columns.forEach((col) => {
      row[col.name] = generateValue(col, config);
    });

    // --- Logic Engine Updates ---
    
    // School Fees Logic
    if (type === DatasetType.SCHOOL_FEES) {
      const studentType = row['Student Type'];
      if (studentType === 'Railways') row['Fee Amount'] = 1500;
      else if (studentType === 'Non-Railways') row['Fee Amount'] = 3500;
      else row['Fee Amount'] = 2500;
      row['Status'] = Math.random() > 0.3 ? 'Paid' : 'Pending';
    }

    // Report Card Logic
    if (type === DatasetType.REPORT_CARD) {
      const maths = Number(row['Maths'] || 0);
      const science = Number(row['Science'] || 0);
      const english = Number(row['English'] || 0);
      const total = maths + science + english;
      const percentage = (total / 300) * 100;
      row['Total'] = total;
      row['Percentage'] = percentage.toFixed(2) + '%';
      row['Grade'] = percentage >= 90 ? 'A+' : percentage >= 75 ? 'A' : percentage >= 60 ? 'B' : percentage >= 35 ? 'C' : 'F';
      row['Result'] = percentage >= 35 ? 'PASS' : 'FAIL';
      row['Remarks'] = percentage >= 90 ? 'Excellent' : percentage >= 35 ? 'Good Effort' : 'Needs Improvement';
    }

    // Payroll Logic
    if (type === DatasetType.PAYROLL) {
      const base = Number(row['Base Salary'] || 20000);
      row['HRA'] = (base * 0.4).toFixed(0);
      row['DA'] = (base * 0.1).toFixed(0);
      row['Gross Salary'] = base + Number(row['HRA']) + Number(row['DA']);
      row['Tax (10%)'] = (row['Gross Salary'] * 0.1).toFixed(0);
      row['Net Payable'] = row['Gross Salary'] - row['Tax (10%)'];
    }

    data.push(row);
  }

  // Handle Duplicates
  if (config.duplicatePct > 0 && data.length > 2) {
    const dupsToCreate = Math.floor(rowCount * (config.duplicatePct / 100));
    for (let i = 0; i < dupsToCreate; i++) {
      data.push({ ...data[Math.floor(Math.random() * data.length)] });
    }
  }

  return data;
};

export const getPresetColumns = (type: DatasetType): ColumnDefinition[] => {
  switch (type) {
    case DatasetType.STUDENT:
      return [
        { name: 'ID', type: 'number' },
        { name: 'Full Name', type: 'string' },
        { name: 'Class', type: 'number', range: { min: 1, max: 12 } },
        { name: 'City', type: 'city' },
        { name: 'Email', type: 'email' }
      ];
    case DatasetType.SCHOOL_FEES:
      return [
        { name: 'Admission No', type: 'number' },
        { name: 'Student Name', type: 'string' },
        { name: 'Student Type', type: 'category', options: ['Railways', 'Non-Railways', 'Staff'] },
        { name: 'Fee Amount', type: 'number' },
        { name: 'Month', type: 'string' }
      ];
    case DatasetType.REPORT_CARD:
      return [
        { name: 'Roll No', type: 'number' },
        { name: 'Student Name', type: 'string' },
        { name: 'Maths', type: 'subject_mark' },
        { name: 'Science', type: 'subject_mark' },
        { name: 'English', type: 'subject_mark' }
      ];
    case DatasetType.SALES:
      return [
        { name: 'Order ID', type: 'number' },
        { name: 'Product', type: 'string', options: PRODUCTS },
        { name: 'Region', type: 'city' },
        { name: 'Qty', type: 'number', range: { min: 1, max: 20 } },
        { name: 'Unit Price', type: 'currency' },
        { name: 'Order Date', type: 'date' }
      ];
    case DatasetType.PAYROLL:
      return [
        { name: 'Emp ID', type: 'number' },
        { name: 'Name', type: 'string' },
        { name: 'Department', type: 'category', options: DEPTS },
        { name: 'Base Salary', type: 'number', range: { min: 15000, max: 80000 } }
      ];
    case DatasetType.HOSPITAL:
      return [
        { name: 'Patient ID', type: 'number' },
        { name: 'Patient Name', type: 'string' },
        { name: 'Age', type: 'number', range: { min: 1, max: 95 } },
        { name: 'Hospital', type: 'category', options: HOSPITALS },
        { name: 'Admit Date', type: 'date' }
      ];
    case DatasetType.BANKING:
      return [
        { name: 'Trans ID', type: 'number' },
        { name: 'Account No', type: 'number', range: { min: 100000, max: 999999 } },
        { name: 'Type', type: 'category', options: ['Credit', 'Debit'] },
        { name: 'Amount', type: 'currency' },
        { name: 'Date', type: 'date' }
      ];
    default:
      return [];
  }
};

export const getPracticeQuestions = (type: DatasetType): string[] => {
  switch(type) {
    case DatasetType.SALES:
      return [
        "1. Find total sales by Region using a Pivot Table.",
        "2. Calculate 'Total Revenue' (Qty * Unit Price) for each order.",
        "3. Which product has the highest sales quantity?",
        "4. Create a month-wise sales trend chart."
      ];
    case DatasetType.REPORT_CARD:
      return [
        "1. Calculate 'Percentage' and 'Grade' using IF conditions.",
        "2. Count how many students failed (Percentage < 35).",
        "3. Find the student with the highest marks in Maths.",
        "4. Create a Bar Chart for student performance."
      ];
    case DatasetType.SCHOOL_FEES:
      return [
        "1. Calculate total pending fees for 'Non-Railways' students.",
        "2. Use VLOOKUP to find a student's Fee Status by Admission No.",
        "3. Highlight all 'Pending' statuses in Red using Conditional Formatting.",
        "4. Group data by Month to see collection trends."
      ];
    case DatasetType.PAYROLL:
      return [
        "1. Calculate HRA (40% of Base) and Gross Salary.",
        "2. Calculate Net Payable after 10% tax deduction.",
        "3. Find total payroll cost for the 'Engineering' department.",
        "4. Sort employees by Net Payable (Highest to Lowest)."
      ];
    default:
      return [
        "1. Clean the data: Remove duplicate rows.",
        "2. Fix text casing and trim extra spaces from names.",
        "3. Identify and fill missing values in the dataset.",
        "4. Create a meaningful summary using a Pivot Table."
      ];
  }
};
