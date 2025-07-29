import { Params } from "@/types/globalTypes";
import BasicProductForm from "../_components/BasicProductForm";
import VariantProductForm from "../_components/VariantProductForm";

const ProductFormPage = async ({ params }: { params: Params }) => {
  const slug = (await params).slug;
  if (slug === "create-basic") {
    return <BasicProductForm />;
  } else if (slug === "create-variant") {
    return <VariantProductForm />;
  } else {
    return <div>ProductFormPage</div>;
  }
};

export default ProductFormPage;
