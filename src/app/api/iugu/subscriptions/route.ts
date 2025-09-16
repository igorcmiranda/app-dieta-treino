import { NextRequest, NextResponse } from 'next/server';

// Criar e gerenciar assinaturas na Iugu
export async function POST(req: NextRequest) {
  try {
    const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN;
    
    if (!IUGU_API_TOKEN) {
      return NextResponse.json(
        { error: 'IUGU_API_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const { customer_id, plan_identifier, payment_method_id, user_id } = await req.json();
    
    const response = await fetch('https://api.iugu.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id,
        plan_identifier,
        only_charge_on_success: true,
        payment_method_id,
        custom_variables: [
          { name: 'user_id', value: user_id },
          { name: 'fitai_integration', value: 'true' }
        ]
      })
    });
    
    const subscription = await response.json();
    
    if (!response.ok) {
      console.error('Erro ao criar subscription na Iugu:', subscription);
      return NextResponse.json(
        { error: subscription.errors || 'Erro ao criar assinatura' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Erro no endpoint de subscriptions POST:', error);
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

    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get('customer_id');
    const subscription_id = searchParams.get('subscription_id');
    
    let url = 'https://api.iugu.com/v1/subscriptions';
    
    if (subscription_id) {
      url += `/${subscription_id}`;
    } else if (customer_id) {
      url += `?customer_id=${customer_id}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.errors || 'Erro ao buscar assinaturas' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no endpoint de subscriptions GET:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Cancelar ou suspender assinatura
export async function DELETE(req: NextRequest) {
  try {
    const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN;
    
    if (!IUGU_API_TOKEN) {
      return NextResponse.json(
        { error: 'IUGU_API_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const subscription_id = searchParams.get('subscription_id');
    
    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id é obrigatório' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`https://api.iugu.com/v1/subscriptions/${subscription_id}/suspend`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: result.errors || 'Erro ao cancelar assinatura' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no endpoint de subscriptions DELETE:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}