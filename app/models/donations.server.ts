import Stripe from "stripe";
import type { ChargesResponse, HourlyData } from "~/types/donation";
const stripe = new Stripe(process.env.STRIPE_API_KEY || "xyz", {
  apiVersion: "2022-11-15",
  maxNetworkRetries: 2,
});

function getStartAndEndTimestamp(period: string | null) {
  let today = new Date();

  today.setHours(13);
  today.setMinutes(0);
  today.setSeconds(0);

  let startTimestamp;
  let endTimestamp;

  if (period && period === "yesterday") {
    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    yesterday.setHours(13);
    yesterday.setSeconds(0);
    yesterday.setMinutes(0);

    const endOfDay = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59
    );

    startTimestamp = Math.floor(yesterday.getTime() / 1000);
    endTimestamp = Math.floor(endOfDay.getTime() / 1000);
  } else {
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );
    startTimestamp = Math.floor(today.getTime() / 1000);
    endTimestamp = Math.floor(endOfDay.getTime() / 1000);
  }

  return {
    startTimestamp,
    endTimestamp,
  };
}

export async function getAllPayments(
  period: string | null
): Promise<ChargesResponse> {
  const limit = 100; // Adjust the limit as needed
  let allPayments: any[] = [];
  let startingAfter: string | null = null;

  const { startTimestamp, endTimestamp } = getStartAndEndTimestamp(period);
  // return {
  //   hourly: {},
  // };
  let listParams: any = {
    created: { gte: startTimestamp, lte: endTimestamp },
    limit: limit,
    status: "succeeded",
  };

  while (true) {
    const payments = (await stripe.charges.list(
      listParams
    )) as Stripe.ApiList<Stripe.Charge>;
    allPayments = allPayments.concat(payments.data);

    if (!payments.has_more) {
      break;
    }

    startingAfter = payments.data[payments.data.length - 1].id;
    listParams = {
      ...listParams,
      starting_after: startingAfter,
    };
  }

  const filteredPayments = allPayments.filter((payment) => {
    // Exclude GivePenny
    if (payment.hasOwnProperty("description")) {
      // Check if the 'description' value contains the words 'GiveMe' (case insensitive)
      return !/GivePenny/i.test(payment.description);
    }
    return true;
  });
  console.log(filteredPayments.length);
  return calculateRunningTotal(filteredPayments);
}

const calculateRunningTotal = (payments: any): ChargesResponse => {
  const hourly: HourlyData = {};

  payments.forEach((payment: any) => {
    const {
      amount_captured,
      created,
      description,
      metadata: { donationMethod },
    } = payment;

    const amount = amount_captured / 100;

    const createdDate = new Date(created * 1000);
    const hour = createdDate.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    });

    if (!hourly[hour]) {
      hourly[hour] = {
        stripeMerch: 0,
        stripeDonation: 0,
        generalDonation: 0,
        runningTotal: 0,
      };
    }

    if (donationMethod?.startsWith("Stripe")) {
      if (description.match(/Merchandise/i)) {
        hourly[hour].stripeMerch += amount;
      } else if (description.match(/Donations/i)) {
        hourly[hour].stripeDonation += amount;
      }
    } else if (
      description.match(/GiveTap/i) ||
      description.match(/Subscription creation/i)
    ) {
      hourly[hour].stripeMerch += amount;
    } else if (
      description.match(/donation/i) &&
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(description)
    ) {
      hourly[hour].generalDonation += amount;
    }

    hourly[hour].runningTotal += amount;
  });

  return {
    hourly,
  };
};

// const calculateRunningTotal = (payments: any): ChargesResponse => {
//   // const totals = {
//   //   stripeMerch: 0,
//   //   stripeDonation: 0,
//   //   generalDonation: 0,
//   //   runningTotal: 0,
//   // };
//   const hourly: HourlyData = {};

//   payments.forEach((payment: any) => {
//     const {
//       amount_captured,
//       created,
//       description,
//       metadata: { donationMethod },
//     } = payment;

//     // Update the running totals based on the donation type and Stripe filter
//     // if (donationMethod?.startsWith("Stripe")) {
//     //   if (description.match(/Merchandise/i)) {
//     //     totals.stripeMerch += amount_captured / 100;
//     //   } else if (description.match(/Donations/i)) {
//     //     totals.stripeDonation += amount_captured / 100;
//     //   }
//     // } else if (description.match(/GiveTap/i)) {
//     //   totals.stripeMerch += amount_captured / 100;
//     // } else if (description.match(/donation/i)) {
//     //   totals.generalDonation += amount_captured / 100;
//     // } else if (description.match(/Subscription creation/i)) {
//     //   totals.generalDonation += amount_captured / 100;
//     // }

//     // // Calculate the running total
//     // totals.runningTotal += amount_captured / 100;

//     // Calculate the hourly totals and group totals
//     const createdDate = new Date(created * 1000);

//     const hour = createdDate.toLocaleString("en-GB", {
//       timeZone: "Europe/London",
//       hour: "2-digit",
//       hour12: false,
//     });

//     if (!hourly[hour as string]) {
//       hourly[hour] = {
//         stripeMerch: 0,
//         stripeDonation: 0,
//         generalDonation: 0,
//         runningTotal: 0,
//       };
//     }

//     if (donationMethod?.startsWith("Stripe")) {
//       if (description.match(/Merchandise/i)) {
//         hourly[hour].stripeMerch += amount_captured / 100;
//       } else if (description.match(/Donations/i)) {
//         hourly[hour].stripeDonation += amount_captured / 100;
//       }
//     } else if (description.match(/GiveTap/i)) {
//       hourly[hour].stripeMerch += amount_captured / 100;
//     } else if (
//       description.match(/donation/i) &&
//       /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(description)
//     ) {
//       hourly[hour].generalDonation += amount_captured / 100;
//     } else if (description.match(/Subscription creation/i)) {
//       hourly[hour].generalDonation += amount_captured / 100;
//     }

//     hourly[hour].runningTotal += amount_captured / 100;
//   });

//   return {
//     // totals,
//     hourly,
//   };
// };
