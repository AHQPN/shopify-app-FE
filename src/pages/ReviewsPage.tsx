import { useState, useEffect, useCallback } from "react";
import {
    Page,
    Layout,
    Card,
    IndexTable,
    useIndexResourceState,
    Text,
    Thumbnail,
    Pagination,
    Icon,
    LegacyCard,
    Grid,
    Select,
    Filters,
    Badge,
} from "@shopify/polaris";
import { StarFilledIcon } from "@shopify/polaris-icons";
import apiClient from "../services/api";

interface ReviewMedia {
    id: number;
    mediaUrl: string;
    mediaType: string;
}

interface Review {
    id: number;
    shop: string;
    productId: string;
    customerName: string;
    rating: number;
    comment: string;
    media: ReviewMedia[];
    createdAt: string;
}

interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    oneStar: number;
    twoStars: number;
    threeStars: number;
    fourStars: number;
    fiveStars: number;
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [ratingFilter, setRatingFilter] = useState<string>("");

    const fetchReviews = useCallback(async (pageIndex = 0, ratingVal = "") => {
        setLoading(true);
        try {
            const params: any = { page: pageIndex, size: 10 };
            if (ratingVal) params.rating = parseInt(ratingVal);

            const response = await apiClient.get(`/reviews`, { params });
            console.log("Raw API Response (Reviews):", response);

            // Interceptor unwraps 'data' if code===1000, so response.data IS the Page object
            const payload = response.data;

            if (payload && payload.content) {
                console.log("Reviews fetched:", payload.content);
                setReviews(payload.content);
                setTotalPages(payload.totalPages);
            } else if (payload && payload.data && payload.data.content) {
                // Fallback in case interceptor didn't unwrap
                setReviews(payload.data.content);
                setTotalPages(payload.data.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = async () => {
        try {
            console.log("Fetching review stats...");
            const res = await apiClient.get("/reviews/stats");
            console.log("Raw API Response (Stats):", res);

            // Interceptor unwraps 'data', so res.data IS 'ReviewStats' object
            const payload = res.data;

            if (payload && typeof payload.totalReviews === 'number') {
                setStats(payload);
            } else if (payload && payload.data) {
                // Fallback
                setStats(payload.data);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    useEffect(() => {
        fetchReviews(page, ratingFilter);
    }, [page, ratingFilter, fetchReviews]);

    useEffect(() => {
        fetchStats();
    }, []);

    const resourceName = { singular: "review", plural: "reviews" };
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(reviews as unknown as { [key: string]: unknown; id: string }[]);

    const handleRatingChange = (value: string) => {
        setRatingFilter(value);
        setPage(0); // Reset to first page
    };

    const rowMarkup = reviews.map(
        ({ id, customerName, rating, comment, createdAt, productId, media }, index) => (
            <IndexTable.Row
                id={id.toString()}
                key={id}
                selected={selectedResources.includes(id.toString())}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">{customerName || 'Anonymous'}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#fbbf24', display: 'flex' }}>{[...Array(rating)].map((_, i) => <Icon key={i} source={StarFilledIcon} tone="warning" />)}</span>
                        <Text variant="bodySm" as="span">({rating})</Text>
                    </div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <div style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{comment}</div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    {media && media.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {media.slice(0, 3).map(m => (
                                <Thumbnail
                                    key={m.id}
                                    source={m.mediaType === "IMAGE" ? m.mediaUrl : ""}
                                    alt="media"
                                    size="small"
                                />
                            ))}
                        </div>
                    ) : "-"}
                </IndexTable.Cell>
                <IndexTable.Cell>{productId.replace('gid://shopify/Product/', '')}</IndexTable.Cell>
                <IndexTable.Cell>
                    {new Date(createdAt).toLocaleDateString()}
                </IndexTable.Cell>
            </IndexTable.Row>
        )
    );

    const filters = [
        {
            key: 'rating',
            label: 'Rating',
            filter: (
                <Select
                    label="Rating"
                    labelInline
                    options={[
                        { label: 'All Ratings', value: '' },
                        { label: '5 Stars', value: '5' },
                        { label: '4 Stars', value: '4' },
                        { label: '3 Stars', value: '3' },
                        { label: '2 Stars', value: '2' },
                        { label: '1 Star', value: '1' },
                    ]}
                    value={ratingFilter}
                    onChange={handleRatingChange}
                />
            ),
            shortcut: true,
        },
    ];

    return (
        <Page title="Product Reviews" fullWidth>
            <Layout>
                {/* Statistics Section */}
                {stats && (
                    <Layout.Section>
                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Total Reviews</Text>
                                    <Text variant="heading2xl" as="p">{stats.totalReviews}</Text>
                                </LegacyCard>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Average Rating</Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Text variant="heading2xl" as="p">{stats.averageRating}</Text>
                                        <Icon source={StarFilledIcon} tone="warning" />
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Breakdown</Text>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '13px' }}>
                                        <Badge tone="success">5★: {stats.fiveStars}</Badge>
                                        <Badge tone="info">4★: {stats.fourStars}</Badge>
                                        <Badge>3★: {stats.threeStars}</Badge>
                                        <Badge tone="attention">2★: {stats.twoStars}</Badge>
                                        <Badge tone="critical">1★: {stats.oneStar}</Badge>
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                        </Grid>
                    </Layout.Section>
                )}

                <Layout.Section>
                    <Card padding="0">
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e1e3e5' }}>
                            <Select
                                label="Filter by Rating"
                                options={[
                                    { label: 'All Ratings', value: '' },
                                    { label: '5 Stars', value: '5' },
                                    { label: '4 Stars', value: '4' },
                                    { label: '3 Stars', value: '3' },
                                    { label: '2 Stars', value: '2' },
                                    { label: '1 Star', value: '1' },
                                ]}
                                value={ratingFilter}
                                onChange={handleRatingChange}
                            />
                        </div>

                        <IndexTable
                            resourceName={resourceName}
                            itemCount={reviews.length}
                            selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: "Customer" },
                                { title: "Rating" },
                                { title: "Comment" },
                                { title: "Media" },
                                { title: "Product ID" },
                                { title: "Date" },
                            ]}
                            loading={loading}
                        >
                            {rowMarkup}
                        </IndexTable>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                            <Pagination
                                hasPrevious={page > 0}
                                onPrevious={() => setPage(page - 1)}
                                hasNext={page < totalPages - 1}
                                onNext={() => setPage(page + 1)}
                            />
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
