import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-4xl font-bold">React Flow Examples</h1>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Basic Flow</CardTitle>
            <CardDescription>
              A simple flow with basic nodes and edges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This example demonstrates the basic functionality of React Flow.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/flow" className={buttonVariants()}>
              View Example
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calculator Example</CardTitle>
            <CardDescription>
              Interactive calculator nodes with real-time updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This example demonstrates how to create calculator nodes that process numeric inputs.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/calculator" className={buttonVariants()}>
              View Example
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
