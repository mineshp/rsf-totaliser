import type { V2_MetaFunction } from "@remix-run/node";
import { getAllPayments } from "../models/donations.server";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useOptionalUser } from "~/utils";
import { getUserId } from "~/session.server";
import { useSearchParams } from "remix";

type LoaderData = {
  donations: Awaited<ReturnType<any>>;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const period = searchParams.get("period");

  const donations = await getAllPayments(period);

  return json({ donations });
};

export const meta: V2_MetaFunction = () => [{ title: "RSF Totaliser" }];

export default function Index() {
  const { donations } = useLoaderData() as LoaderData;

  const user = useOptionalUser();

  function generateHourlyTimes() {
    var startHour = 5; // 08:00 AM
    var endHour = 21; // 08:00 PM
    var times = [];

    for (var hour = startHour; hour <= endHour; hour++) {
      var time = new Date();
      time.setHours(hour, 0, 0, 0); // Set the current hour and reset minutes, seconds, and milliseconds
      times.push(
        time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }

    return times;
  }

  const hourlyTimes = generateHourlyTimes();
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  const lastRequested = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-rsfRed-400">
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <h1 className="pb-4 text-center text-4xl">
          <span className="block uppercase text-white">RSF Totaliser</span>
        </h1>
        <div className="flex items-center bg-red-200 px-4 py-3 text-sm font-bold text-red-900 sm:px-6 sm:py-4 sm:text-base">
          <svg
            className="mr-2 h-4 w-4 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
          </svg>
          <p>
            {`Totaliser running for today between 5am - 9pm, refresh page for latest totals, last update ${lastRequested}.`}
          </p>
        </div>
        <h2 className="text-bold py-2 text-center text-lg uppercase text-white">
          Daily Total
        </h2>
        <div className="rounded-full pt-2">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-sky-300 text-xs uppercase text-rsfBlue-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Stripe Tap to Pay Merch Total
                </th>
                <th scope="col" className="px-6 py-3">
                  Stripe Tap to Pay Donation Total
                </th>
                <th scope="col" className="px-6 py-3">
                  Donation Form Total
                </th>
                <th scope="col" className="px-6 py-3">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-blue-600 bg-rsfBlue-400 text-white">
                <td className="px-6 py-4 text-2xl">
                  £{donations.totals.stripeMerch.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-2xl">
                  £{donations.totals.stripeDonation.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-2xl">
                  £{donations.totals.generalDonation.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-2xl">
                  £{donations.totals.runningTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <h2 className="text-bold py-2 text-center text-lg uppercase text-white">
            Hourly breakdown
          </h2>
          <div className="p-2">
            <div className="relative overflow-x-auto shadow-md">
              <table className="w-full text-left text-sm text-rsfBlue-400 dark:text-rsfBlue-400">
                <thead className="bg-sky-300 text-xs uppercase text-rsfBlue-400 dark:bg-sky-300 dark:text-rsfBlue-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Hourly
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Stripe Tap to Pay (Merch)
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Stripe Tap to Pay (Donation)
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Donation Form
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Hourly Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hourlyTimes.map((time) => (
                    <tr
                      className={`border-b ${
                        currentHour === Number(time.substring(0, 2))
                          ? "bg-red-200 text-lg"
                          : "bg-white"
                      } border-rsfBlue-400`}
                      key={time}
                    >
                      <td className="px-6 py-4">{time}</td>
                      <td className="px-6 py-4">
                        {donations.hourly[
                          time.substring(0, 2)
                        ]?.stripeMerch.toFixed(2) ?? "-"}
                      </td>
                      <td className="px-6 py-4">
                        {donations.hourly[
                          time.substring(0, 2)
                        ]?.stripeDonation.toFixed(2) ?? "-"}
                      </td>
                      <td className="px-6 py-4">
                        {donations.hourly[
                          time.substring(0, 2)
                        ]?.generalDonation.toFixed(2) ?? "-"}
                      </td>
                      <td className="px-6 py-4">
                        {donations.hourly[
                          time.substring(0, 2)
                        ]?.runningTotal.toFixed(2) ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
