import { pool } from '../server/db.js';

async function testExactRevenueQuery() {
  try {
    console.log('Testando a query exata da função getRevenueReport...');
    
    // Esta é a query exata da função getRevenueReport para período 30d
    const query = `
      SELECT 
        DATE(created_at) as period,
        SUM(price) as revenue,
        COUNT(*) as subscriptions
      FROM subscriptions 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY period DESC
    `;
    
    console.log('Query sendo executada:');
    console.log(query);
    
    const result = await pool.query(query);
    console.log('Resultado:', result.rows);
    
    // Vamos também testar com uma query mais explícita
    console.log('\nTestando query com alias de tabela...');
    const queryWithAlias = `
      SELECT 
        DATE(s.created_at) as period,
        SUM(s.price) as revenue,
        COUNT(*) as subscriptions
      FROM subscriptions s
      WHERE s.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(s.created_at)
      ORDER BY period DESC
    `;
    
    const result2 = await pool.query(queryWithAlias);
    console.log('Resultado com alias:', result2.rows);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

testExactRevenueQuery();