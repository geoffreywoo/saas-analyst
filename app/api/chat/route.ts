import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/resources';

// Define interfaces for our data structures
interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  amount: number;
  status: string;
  startDate: Date;
  endDate: Date | null;
  canceledAt: Date | null;
  product?: Product;
}

interface Product {
  id: string;
  name: string;
  price: number;
  subscriptions?: Subscription[];
}

interface Customer {
  id: string;
  email: string;
  name?: string;
  subscriptions: Subscription[];
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// Define available database functions
const dbTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "countCustomers",
      description: "Count the total number of customers in the database",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description: "Optional filter conditions (e.g., 'with active subscriptions')",
            enum: ["all", "with active subscriptions"],
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProductStats",
      description: "Get statistics about all product tiers",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getCustomerSample",
      description: "Get a sample of customers with their subscription details",
      parameters: {
        type: "object",
        properties: {
          count: {
            type: "number",
            description: "Number of customers to retrieve (default: 10, max: 20)"
          },
          productFilter: {
            type: "string",
            description: "Filter by product name (e.g., 'Free', 'Plus', 'Pro')"
          },
          statusFilter: {
            type: "string",
            description: "Filter by subscription status (e.g., 'active', 'canceled')"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculateChurnRate",
      description: "Calculate churn rate for the entire customer base or by product",
      parameters: {
        type: "object",
        properties: {
          product: {
            type: "string",
            description: "Product name to filter by (optional)"
          },
          timePeriod: {
            type: "string",
            description: "Time period to analyze (e.g., 'all time', 'last month', 'last 3 months')",
            enum: ["all time", "last month", "last 3 months", "last 6 months", "last year"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getRevenueMetrics",
      description: "Get revenue metrics for the business",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            description: "Specific metric to retrieve",
            enum: ["mrr", "arr", "ltv", "all"]
          },
          byProduct: {
            type: "boolean",
            description: "Whether to break down by product"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getSubscriptionGrowth",
      description: "Get subscription growth over time",
      parameters: {
        type: "object",
        properties: {
          timeGranularity: {
            type: "string",
            description: "Time granularity for the data",
            enum: ["daily", "weekly", "monthly"]
          },
          timePeriod: {
            type: "string",
            description: "Time period to analyze",
            enum: ["last month", "last 3 months", "last 6 months", "last year", "all time"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "findCustomerByEmail",
      description: "Find a specific customer by email",
      parameters: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "Email address to search for (partial match allowed)"
          }
        },
        required: ["email"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyzePlanChanges",
      description: "Analyze customers upgrading or downgrading between plans",
      parameters: {
        type: "object",
        properties: {
          changeType: {
            type: "string",
            description: "Type of plan change to analyze",
            enum: ["upgrades", "downgrades", "both"]
          }
        },
        required: []
      }
    }
  }
];

// Handle errors properly with type
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }
    
    const initialSystemPrompt = `You are an analytics AI assistant for a SaaS business.
To answer the user's question, you'll need to decide what data to query.
You have access to several functions that can retrieve specific data from the database.
Think step by step about what data you need, then call the appropriate functions.`;

    // Call OpenAI to decide what to query
    const planningResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: initialSystemPrompt },
        { role: "user", content: message }
      ],
      tools: dbTools,
      tool_choice: "auto",
      temperature: 0.2,
    });
    
    // Extract the tool calls from the response
    const planningMessage = planningResponse.choices[0].message;
    const toolCalls = planningMessage.tool_calls || [];
    
    // Execute each function call
    const toolResults = [];
    
    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') continue;
      
      const { name: functionName, arguments: argsString } = toolCall.function;
      const args = JSON.parse(argsString);
      
      let result;
      
      try {
        switch (functionName) {
          case 'countCustomers':
            result = await countCustomers(args.filter);
            break;
          case 'getProductStats':
            result = await getProductStats();
            break;
          case 'getCustomerSample':
            result = await getCustomerSample(args.count, args.productFilter, args.statusFilter);
            break;
          case 'calculateChurnRate':
            result = await calculateChurnRate(args.product, args.timePeriod);
            break;
          case 'getRevenueMetrics':
            result = await getRevenueMetrics(args.metric, args.byProduct);
            break;
          case 'getSubscriptionGrowth':
            result = await getSubscriptionGrowth(args.timeGranularity, args.timePeriod);
            break;
          case 'findCustomerByEmail':
            result = await findCustomerByEmail(args.email);
            break;
          case 'analyzePlanChanges':
            result = await analyzePlanChanges(args.changeType);
            break;
          default:
            result = { error: `Function ${functionName} not found` };
        }
      } catch (error) {
        result = { error: handleError(error) };
      }
      
      toolResults.push({
        tool_call_id: toolCall.id,
        role: "function" as const,
        name: functionName,
        content: JSON.stringify(result)
      });
    }
    
    // Now, send the original message and the function results back to the model for analysis
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert SaaS analytics assistant. Analyze the data retrieved from the database and provide insights based on the user's question. Format your response in a clear, professional manner with relevant metrics highlighted. If appropriate, suggest visualizations or further analyses that might be valuable." },
        { role: "user", content: message },
        planningMessage,
        ...toolResults
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const reply = finalResponse.choices[0].message.content || 
      "I couldn't analyze the data at this time. Please try again.";
      
    return NextResponse.json({ reply });
    
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}

// Database access functions
async function countCustomers(filter = 'all') {
  try {
    if (filter === 'with active subscriptions') {
      // Count customers with at least one active subscription
      const result = await prisma.customer.count({
        where: {
          subscriptions: {
            some: {
              status: 'active'
            }
          }
        }
      });
      return { count: result };
    } else {
      // Count all customers
      const result = await prisma.customer.count();
      return { count: result };
    }
  } catch (error) {
    return { error: handleError(error) };
  }
}

async function getProductStats() {
  try {
    const products = await prisma.product.findMany({
      include: {
        subscriptions: {
          select: {
            status: true,
            amount: true
          }
        },
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    });
    
    const productsWithStats = products.map((product: Product & { _count: { subscriptions: number }, subscriptions: { status: string, amount: number }[] }) => {
      const activeSubscriptions = product.subscriptions.filter(
        sub => sub.status === 'active'
      );
      
      const mrr = activeSubscriptions.reduce(
        (sum: number, sub) => sum + sub.amount, 
        0
      );
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        totalSubscriptions: product._count.subscriptions,
        activeSubscriptions: activeSubscriptions.length,
        mrr
      };
    });
    
    return { products: productsWithStats };
  } catch (error) {
    return { error: handleError(error) };
  }
}

async function getCustomerSample(count = 10, productFilter: string | null = null, statusFilter: string | null = null) {
  try {
    // Build the where clause based on filters
    const where: any = {};
    
    if (productFilter) {
      where.subscriptions = {
        some: {
          product: {
            name: productFilter
          }
        }
      };
    }
    
    if (statusFilter) {
      if (!where.subscriptions) {
        where.subscriptions = { some: {} };
      }
      where.subscriptions.some.status = statusFilter;
    }
    
    const customers = await prisma.customer.findMany({
      where,
      include: {
        subscriptions: {
          include: {
            product: true
          }
        }
      },
      take: count
    });
    
    // Calculate total amount paid per customer and prepare a more readable format
    const customersWithMetrics = customers.map((customer: Customer) => {
      const totalPaid = customer.subscriptions.reduce((total: number, sub: Subscription) => {
        // Calculate months active
        const startDate = new Date(sub.startDate);
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date();
        const monthsActive = Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
        );
        
        return total + (sub.amount * monthsActive);
      }, 0);
      
      return {
        id: customer.id,
        email: customer.email,
        totalPaid,
        subscriptionCount: customer.subscriptions.length,
        products: customer.subscriptions.map((sub: Subscription) => sub.product?.name).filter(Boolean)
      };
    });
    
    return { customers: customersWithMetrics };
  } catch (error) {
    return { error: handleError(error) };
  }
}

async function calculateChurnRate(product = null, timePeriod = 'all time') {
  // Build date filter based on time period
  const dateFilter = {};
  const now = new Date();
  
  if (timePeriod !== 'all time') {
    let monthsBack = 1;
    if (timePeriod === 'last 3 months') monthsBack = 3;
    if (timePeriod === 'last 6 months') monthsBack = 6;
    if (timePeriod === 'last year') monthsBack = 12;
    
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - monthsBack);
    dateFilter.startDate = { gte: startDate };
  }
  
  // Build product filter
  let productFilter = {};
  if (product) {
    productFilter = {
      product: {
        name: product
      }
    };
  }
  
  // Count total and canceled subscriptions
  const totalSubscriptions = await prisma.subscription.count({
    where: {
      ...dateFilter,
      ...productFilter
    }
  });
  
  const canceledSubscriptions = await prisma.subscription.count({
    where: {
      ...dateFilter,
      ...productFilter,
      status: 'canceled'
    }
  });
  
  const churnRate = totalSubscriptions > 0 
    ? (canceledSubscriptions / totalSubscriptions) * 100 
    : 0;
  
  return {
    totalSubscriptions,
    canceledSubscriptions,
    churnRate,
    timePeriod,
    product: product || 'all products'
  };
}

async function getRevenueMetrics(metric = 'all', byProduct = false) {
  // Get active subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { 
      status: 'active' 
    },
    include: {
      product: true
    }
  });
  
  // Calculate MRR
  const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const arr = mrr * 12;
  
  // Calculate LTV
  const totalCustomers = await prisma.customer.count();
  const avgSubscriptionLifetime = 12; // Assumption: 1 year average lifetime
  const ltv = totalCustomers > 0 ? (mrr / totalCustomers) * avgSubscriptionLifetime : 0;
  
  // If byProduct is true, calculate metrics by product
  let productBreakdown = null;
  if (byProduct) {
    // Group by product
    const productMap = {};
    activeSubscriptions.forEach(sub => {
      const productName = sub.product.name;
      if (!productMap[productName]) {
        productMap[productName] = {
          name: productName,
          customerCount: 0,
          mrr: 0
        };
      }
      productMap[productName].customerCount++;
      productMap[productName].mrr += sub.amount;
    });
    
    // Convert to array and calculate additional metrics
    productBreakdown = Object.values(productMap).map(product => ({
      ...product,
      arr: product.mrr * 12,
      percentOfMrr: mrr > 0 ? (product.mrr / mrr) * 100 : 0
    }));
  }
  
  const result = {
    mrr,
    arr,
    ltv,
    activeCustomerCount: activeSubscriptions.length,
    avgRevenuePerCustomer: activeSubscriptions.length > 0 
      ? mrr / activeSubscriptions.length 
      : 0
  };
  
  if (byProduct) {
    result.byProduct = productBreakdown;
  }
  
  // Return only requested metrics if specified
  if (metric === 'mrr') return { mrr: result.mrr, byProduct: byProduct ? result.byProduct : undefined };
  if (metric === 'arr') return { arr: result.arr, byProduct: byProduct ? result.byProduct : undefined };
  if (metric === 'ltv') return { ltv: result.ltv };
  
  return result;
}

async function getSubscriptionGrowth(timeGranularity = 'monthly', timePeriod = 'all time') {
  // Get all subscriptions
  const subscriptions = await prisma.subscription.findMany({
    select: {
      startDate: true,
      status: true,
      canceledAt: true
    }
  });
  
  // Determine date format and filter based on time period
  let dateFormat;
  let dateFilter;
  const now = new Date();
  
  if (timeGranularity === 'daily') {
    dateFormat = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD
  } else if (timeGranularity === 'weekly') {
    dateFormat = (date) => {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      return startOfWeek.toISOString().split('T')[0];
    };
  } else { // monthly
    dateFormat = (date) => date.toISOString().slice(0, 7); // YYYY-MM
  }
  
  if (timePeriod !== 'all time') {
    let monthsBack = 1;
    if (timePeriod === 'last 3 months') monthsBack = 3;
    if (timePeriod === 'last 6 months') monthsBack = 6;
    if (timePeriod === 'last year') monthsBack = 12;
    
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - monthsBack);
    dateFilter = (date) => date >= startDate;
  } else {
    dateFilter = () => true;
  }
  
  // Group subscriptions by time period
  const growthData = {};
  
  subscriptions.forEach(sub => {
    const startDate = new Date(sub.startDate);
    if (dateFilter(startDate)) {
      const periodKey = dateFormat(startDate);
      
      if (!growthData[periodKey]) {
        growthData[periodKey] = {
          newSubscriptions: 0,
          canceledSubscriptions: 0,
          netGrowth: 0
        };
      }
      
      growthData[periodKey].newSubscriptions++;
      growthData[periodKey].netGrowth++;
    }
    
    // Handle cancellations
    if (sub.canceledAt) {
      const cancelDate = new Date(sub.canceledAt);
      if (dateFilter(cancelDate)) {
        const periodKey = dateFormat(cancelDate);
        
        if (!growthData[periodKey]) {
          growthData[periodKey] = {
            newSubscriptions: 0,
            canceledSubscriptions: 0,
            netGrowth: 0
          };
        }
        
        growthData[periodKey].canceledSubscriptions++;
        growthData[periodKey].netGrowth--;
      }
    }
  });
  
  // Convert to array and sort by date
  const result = Object.keys(growthData)
    .sort()
    .map(key => ({
      period: key,
      ...growthData[key]
    }));
  
  // Calculate cumulative growth
  let cumulativeSubscriptions = 0;
  result.forEach(period => {
    cumulativeSubscriptions += period.netGrowth;
    period.totalSubscriptions = cumulativeSubscriptions;
  });
  
  return {
    growthByPeriod: result,
    timeGranularity,
    timePeriod
  };
}

async function findCustomerByEmail(email) {
  const customers = await prisma.customer.findMany({
    where: {
      email: {
        contains: email,
        mode: 'insensitive'
      }
    },
    include: {
      subscriptions: {
        include: {
          product: true
        }
      }
    },
    take: 5 // Limit to 5 matches
  });
  
  if (customers.length === 0) {
    return { message: "No customers found with that email" };
  }
  
  return customers.map(customer => {
    // Calculate total lifetime value
    const ltv = customer.subscriptions.reduce((total, sub) => {
      const startDate = new Date(sub.startDate);
      const endDate = sub.endDate ? new Date(sub.endDate) : new Date();
      const monthsDiff = Math.max(
        1,
        ((endDate.getFullYear() - startDate.getFullYear()) * 12) +
        (endDate.getMonth() - startDate.getMonth())
      );
      return total + (sub.amount * monthsDiff);
    }, 0);
    
    const activeSubscription = customer.subscriptions.find(sub => sub.status === 'active');
    
    return {
      id: customer.id,
      email: customer.email,
      currentPlan: activeSubscription ? activeSubscription.product.name : 'None',
      monthlyValue: activeSubscription ? activeSubscription.amount : 0,
      isActive: !!activeSubscription,
      totalPaid: ltv,
      subscriptionHistory: customer.subscriptions.map(sub => ({
        product: sub.product.name,
        price: sub.amount,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        canceledAt: sub.canceledAt
      }))
    };
  });
}

async function analyzePlanChanges(changeType = 'both') {
  // Get all customers with their subscriptions
  const customers = await prisma.customer.findMany({
    include: {
      subscriptions: {
        include: {
          product: true
        },
        orderBy: {
          startDate: 'asc'
        }
      }
    }
  });
  
  // Analyze plan changes
  const planChanges = {
    upgrades: [],
    downgrades: [],
    upgradePaths: {},
    downgradePaths: {}
  };
  
  customers.forEach(customer => {
    if (customer.subscriptions.length <= 1) {
      return;
    }
    
    for (let i = 1; i < customer.subscriptions.length; i++) {
      const prevSub = customer.subscriptions[i-1];
      const currentSub = customer.subscriptions[i];
      
      if (prevSub.product.price < currentSub.product.price) {
        // This is an upgrade
        planChanges.upgrades.push({
          customerId: customer.id,
          email: customer.email,
          fromPlan: prevSub.product.name,
          toPlan: currentSub.product.name,
          priceDifference: currentSub.product.price - prevSub.product.price,
          upgradeDate: currentSub.startDate
        });
        
        const path = `${prevSub.product.name} → ${currentSub.product.name}`;
        planChanges.upgradePaths[path] = (planChanges.upgradePaths[path] || 0) + 1;
      } 
      else if (prevSub.product.price > currentSub.product.price) {
        // This is a downgrade
        planChanges.downgrades.push({
          customerId: customer.id,
          email: customer.email,
          fromPlan: prevSub.product.name,
          toPlan: currentSub.product.name,
          priceDifference: prevSub.product.price - currentSub.product.price,
          downgradeDate: currentSub.startDate
        });
        
        const path = `${prevSub.product.name} → ${currentSub.product.name}`;
        planChanges.downgradePaths[path] = (planChanges.downgradePaths[path] || 0) + 1;
      }
    }
  });
  
  // Determine what to return based on changeType
  const result = {
    summary: {
      totalUpgrades: planChanges.upgrades.length,
      totalDowngrades: planChanges.downgrades.length,
      upgradeDowngradeRatio: planChanges.downgrades.length > 0 
        ? planChanges.upgrades.length / planChanges.downgrades.length 
        : 0
    }
  };
  
  if (changeType === 'upgrades' || changeType === 'both') {
    result.upgrades = {
      count: planChanges.upgrades.length,
      paths: planChanges.upgradePaths,
      recentExamples: planChanges.upgrades
        .sort((a, b) => new Date(b.upgradeDate).getTime() - new Date(a.upgradeDate).getTime())
        .slice(0, 5)
    };
  }
  
  if (changeType === 'downgrades' || changeType === 'both') {
    result.downgrades = {
      count: planChanges.downgrades.length,
      paths: planChanges.downgradePaths,
      recentExamples: planChanges.downgrades
        .sort((a, b) => new Date(b.downgradeDate).getTime() - new Date(a.downgradeDate).getTime())
        .slice(0, 5)
    };
  }
  
  return result;
} 