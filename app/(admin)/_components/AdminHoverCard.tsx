import { Card, Group, SimpleGrid, SimpleGridProps, Text } from "@mantine/core";
import Link from "next/link";
export interface AdminHoverCardData {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}

interface AdminHoverCardProps extends Pick<SimpleGridProps, "cols"> {
  data: AdminHoverCardData[];
}
const AdminHoverCard = ({
  data,
  cols = {
    xs: 2,
    md: 3,
    lg: 4,
  },
}: AdminHoverCardProps) => {
  return (
    <SimpleGrid cols={cols}>
      {data.map((item, index) => (
        <Card
          component={Link}
          href={item.href}
          key={`${item.href}-${index}`}
          withBorder
          radius={"md"}
          shadow="md"
          p="md"
          py={"lg"}
          className="hover:bg-gray-500 transition-colors duration-200 group"
        >
          <Group wrap="nowrap" gap="sm" align="flex-start">
            <div className="group-hover:text-white transition-colors duration-200">
              {item.icon}
            </div>
            <div>
              <Text
                fz="md"
                fw={700}
                className="group-hover:text-white text-black transition-colors duration-200"
              >
                {item.title}
              </Text>
              <Text
                fz="sm"
                fw={500}
                className="group-hover:text-white text-gray-600 transition-colors duration-200"
              >
                {item.description}
              </Text>
            </div>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
};

export default AdminHoverCard;
