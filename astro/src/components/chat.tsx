export default function Chat({
  tellJoke,
}: {
  tellJoke: (subject: string) => void;
}) {
  console.log("fn >>>>", tellJoke);

  return (
    <div
      className="text-3xl font-bold underline p-8"
      onClick={() => tellJoke("chicken")}
    >
      hi there
    </div>
  );
}
