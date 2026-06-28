import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservá tu Turno",
  description:
    "Reservá tu turno para maquillaje o estética de uñas en UP! Estudio. Elegí el servicio, la fecha y el horario que mejor te quede.",
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
