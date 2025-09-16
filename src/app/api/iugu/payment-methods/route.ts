import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Gerenciar métodos de pagamento
export async function POST(req: NextRequest) {
  try {
    const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN;
    
    if (!IUGU_API_TOKEN) {
      return NextResponse.json(
        { error: 'IUGU_API_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const { customer_id, token, description, set_as_default } = await req.json();
    
    if (!customer_id || !token) {
      return NextResponse.json(
        { error: 'customer_id e token são obrigatórios' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`https://api.iugu.com/v1/customers/${customer_id}/payment_methods`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        description: description || 'Cartão de Crédito',
        set_as_default: set_as_default !== false
      })
    });
    
    const paymentMethod = await response.json();
    
    if (!response.ok) {
      console.error('Erro ao criar payment method na Iugu:', paymentMethod);
      return NextResponse.json(
        { error: paymentMethod.errors || 'Erro ao adicionar método de pagamento' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error('Erro no endpoint de payment-methods POST:', error);
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
    
    if (!customer_id) {
      return NextResponse.json(
        { error: 'customer_id é obrigatório' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`https://api.iugu.com/v1/customers/${customer_id}/payment_methods`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`
      }
    });
    
    const methods = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: methods.errors || 'Erro ao buscar métodos de pagamento' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(methods);
  } catch (error) {
    console.error('Erro no endpoint de payment-methods GET:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

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
    const customer_id = searchParams.get('customer_id');
    const payment_method_id = searchParams.get('payment_method_id');
    
    if (!customer_id || !payment_method_id) {
      return NextResponse.json(
        { error: 'customer_id e payment_method_id são obrigatórios' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`https://api.iugu.com/v1/customers/${customer_id}/payment_methods/${payment_method_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.errors || 'Erro ao remover método de pagamento' },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no endpoint de payment-methods DELETE:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}