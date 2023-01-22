const MODEL_VERSION =
  "2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const runModel = async (image: string): Promise<string | null> => {
  const res = await fetch(`https://api.replicate.com/v1/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: {
        image,
      },
    }),
  });
  const json = await res.json();
  const id = json["id"];
  if (!id) {
    return null;
  }
  let result = await checkForResult(id);
  while (!result) {
    await sleep(1000);
    result = await checkForResult(id);
  }
  return result;
};

const checkForResult = async (id: string): Promise<string | null> => {
  if (!id) {
    throw Error('Missing Id');
  }
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  if (!json["completed_at"]) {
    return null;
  }
  return json["output"] ?? null;
};
