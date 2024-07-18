const tableContent = document.getElementById('table');
const searchInput = document.getElementById('search');
const graphInput = document.getElementById('graph');
let myChart;
var customers;
var transactions;

// Fetch customer and transaction data concurrently
async function fetchData() {
  try {
    const [customersResponse, transactionsResponse] = await Promise.all([
      fetch('http://localhost:3000/customers'),
      fetch('http://localhost:3000/transactions')
    ]);

    if (!customersResponse.ok || !transactionsResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const customers = await customersResponse.json();
    const transactions = await transactionsResponse.json();

    return { customers, transactions };
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

function updateCustomersNo(customers) {
  const customersNo = document.getElementById('customersNo');
  customersNo.textContent = `The number of customers is ${customers.length}`;
}

function displayTransactions(transactions) {
  let tableBody = '';
  for (const transaction of transactions) {
    const customerId = transaction.customer_id - 1;
    const customerName = customers[customerId].name;
    tableBody += `
      <tr>
        <td><span class="math-inline">${transaction.id}</span></td>
        <td><span>${customerName}</span></td>
        <td><span>${transaction.amount}</span></td>
        <td><span class="math-inline">${transaction.date}</span></td>
      </tr>
    `;
  }
  tableContent.innerHTML = tableBody; // Use innerHTML for faster updates
}

function filterTransactions(transactions, customerId) {
  return transactions.filter(transaction => transaction.customer_id === customerId);
}

function calculateDailyTotals(transactions) {
  return transactions.reduce((acc, transaction) => {
    const date = transaction.date.slice(0, 10);
    acc[date] = (acc[date] || 0) + transaction.amount;
    return acc;
  }, {});
}

function createChartData(dailyTotals) {
  const labels = Object.keys(dailyTotals);
  const data = Object.values(dailyTotals);
  return { labels, data };
}

function updateChart(customerId, dailyTotals) {
  if (myChart) {
    myChart.destroy(); // Destroy previous chart
  }

  const chartData = createChartData(dailyTotals);
  const ctx = document.getElementById('transactionChart').getContext('2d');
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: `Total Transaction Amount of ${customers[customerId - 1].name}`,
        data: chartData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'x',
      scales: {
        x: {
          stacked: true,
          barPercentage: 1, // Set to 1 to fill the category width
          categoryPercentage: 0.25 // Set to 25% of the category width
        }
      }
    }
  });
}

async function main() {
  const data = await fetchData();
  customers = data.customers;
  transactions=data.transactions
  updateCustomersNo(data.customers);
  displayTransactions(data.transactions);
  updateChart(1, calculateDailyTotals(filterTransactions(data.transactions, 1))); // Initial chart for customer 1

  searchInput.addEventListener('keyup', function() {
    const searchValue = this.value.toLowerCase();
    const filteredTransactions = data.transactions.filter(transaction => {
      const customerName = data.customers[transaction.customer_id - 1].name.toLowerCase();
      const amountString = transaction.amount.toString();
      return customerName.includes(searchValue) || amountString.includes(searchValue);
    });
    displayTransactions(filteredTransactions);
  });
}

graphInput.addEventListener('keyup', function() {
    const customerId = parseInt(this.value);
    if (!isNaN(customerId)) {
      const filteredTransactions = filterTransactions(transactions, customerId);
      const dailyTotals = calculateDailyTotals(filteredTransactions);
      updateChart(customerId, dailyTotals);
    }
})
main()