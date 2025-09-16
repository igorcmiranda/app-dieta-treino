import { NextRequest, NextResponse } from 'next/server';

// Criar e gerenciar planos na Iugu
export async function POST(req: NextRequest) {
  try {
    const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN;
    
    if (!IUGU_API_TOKEN) {
      return NextResponse.json(
        { error: 'IUGU_API_TOKEN não configurado' },
        { status: 500 }
      );
    }

    // Criar planos do FitAI
    const plans = [
      {
        name: "FitAI Starter",
        identifier: "fitai_starter_monthly",
        interval: 1,
        interval_type: "months",
        value_cents: 1997, // R$ 19,97
        payable_with: ["credit_card", "bank_slip", "pix"],
        features: [
          { name: "Dietas mensais", value: "1 por mês" },
          { name: "Treinos mensais", value: "1 por mês" },
          { name: "Análise corporal básica", value: "Incluído" }
        ]
      },
      {
        name: "FitAI Standard", 
        identifier: "fitai_standard_monthly",
        interval: 1,
        interval_type: "months",
        value_cents: 2997, // R$ 29,97
        payable_with: ["credit_card", "bank_slip", "pix"],
        features: [
          { name: "Dietas mensais", value: "2 por mês" },
          { name: "Treinos mensais", value: "2 por mês" },
          { name: "Análise corporal avançada", value: "Incluído" },
          { name: "Pode mudar dieta", value: "Sim" }
        ]
      },
      {
        name: "FitAI Premium",
        identifier: "fitai_premium_monthly", 
        interval: 1,
        interval_type: "months",
        value_cents: 4997, // R$ 49,97
        payable_with: ["credit_card", "bank_slip", "pix"],
        features: [
          { name: "Dietas mensais", value: "Ilimitadas" },
          { name: "Treinos mensais", value: "4 por mês" },
          { name: "Consultoria suplementação", value: "Incluído" },
          { name: "Suporte 24/7", value: "Incluído" }
        ]
      }
    ];

    const results = [];
    for (const plan of plans) {
      const response = await fetch('https://api.iugu.com/v1/plans', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(plan)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error(`Erro ao criar plano ${plan.name}:`, result);
        // Continue criando outros planos mesmo se um falhar
      }
      
      results.push({
        plan: plan.identifier,
        success: response.ok,
        data: result
      });
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Erro no endpoint de plans POST:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN;
    
    if (!IUGU_API_TOKEN) {
      return NextResponse.json(
        { error: 'IUGU_API_TOKEN não configurado' },
        { status: 500 }
      );
    }

    // Listar planos
    const response = await fetch('https://api.iugu.com/v1/plans', {
      headers: {
        'Authorization': `Bearer ${IUGU_API_TOKEN}`
      }
    });
    
    const plans = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: plans.errors || 'Erro ao buscar planos' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Erro no endpoint de plans GET:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}