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
    Modal,
    Button,
    ButtonGroup,
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
    productName: string;
    customerName: string;
    rating: number;
    comment: string;
    media: ReviewMedia[];
    status: boolean;
    hideReason: string | null;
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
    const [productFilter, setProductFilter] = useState<string>("");
    const [products, setProducts] = useState<{ label: string, value: string }[]>([]);
    const [hideReasons, setHideReasons] = useState<{ label: string, value: string }[]>([]);
    const [isHideModalOpen, setIsHideModalOpen] = useState(false);
    const [selectedHideReason, setSelectedHideReason] = useState<string>("");
    const [currentReview, setCurrentReview] = useState<Review | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);

    const fetchReviews = useCallback(async (pageIndex = 0, ratingVal = "", productVal = "") => {
        setLoading(true);
        try {
            const params: any = { page: pageIndex, size: 10 };
            if (ratingVal) params.rating = parseInt(ratingVal);
            if (productVal) params.productId = productVal;

            const response = await apiClient.get(`/reviews`, { params });
            const payload = response.data;
            if (payload && payload.content) {
                setReviews(payload.content);
                setTotalPages(payload.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await apiClient.get("/products");
            if (res.data) {
                const options = res.data.map((p: any) => ({ label: p.title, value: p.id }));
                setProducts([{ label: 'Tất cả sản phẩm', value: '' }, ...options]);
            }
        } catch (e) {
            console.error("Failed to fetch products", e);
        }
    };

    const fetchHideReasons = async () => {
        try {
            const res = await apiClient.get("/reviews/hide-reasons");
            if (res.data) {
                setHideReasons(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch hide reasons", e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await apiClient.get("/reviews/stats");
            const payload = res.data;
            if (payload && typeof payload.totalReviews === 'number') {
                setStats(payload);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    useEffect(() => {
        fetchReviews(page, ratingFilter, productFilter);
    }, [page, ratingFilter, productFilter, fetchReviews]);

    useEffect(() => {
        fetchStats();
        fetchProducts();
        fetchHideReasons();
    }, []);

    const handleRatingChange = (value: string) => {
        setRatingFilter(value);
        setPage(0);
    };

    const handleProductChange = (value: string) => {
        setProductFilter(value);
        setPage(0);
    };

    const handleToggleStatus = async (review: Review) => {
        if (review.status) {
            // If currently published -> Hide
            setCurrentReview(review);
            setSelectedHideReason(hideReasons[0]?.value || "");
            setIsHideModalOpen(true);
        } else {
            // If currently hidden -> Publish
            await updateReviewStatus(review.id, true, undefined);
        }
    };

    const updateReviewStatus = async (id: number, status: boolean, hideReason?: string) => {
        setUpdating(id);
        try {
            await apiClient.put("/reviews", {
                id,
                status,
                hideReason
            });
            // Refresh data
            fetchReviews(page, ratingFilter, productFilter);
            fetchStats();
        } catch (e) {
            console.error("Failed to update status", e);
        } finally {
            setUpdating(null);
        }
    };

    const handleHideConfirm = async () => {
        if (currentReview) {
            await updateReviewStatus(currentReview.id, false, selectedHideReason);
            setIsHideModalOpen(false);
            setCurrentReview(null);
        }
    };

    const resourceName = { singular: "review", plural: "reviews" };
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(reviews as unknown as { [key: string]: unknown; id: string }[]);

    const rowMarkup = reviews.map(
        ({ id, customerName, rating, comment, createdAt, productName, media, status, shop, hideReason }, index) => {
            const displayRating = rating || 0;
            return (
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Rating */}
                            {displayRating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#fbbf24', display: 'flex' }}>
                                        {[...Array(displayRating)].map((_, i) => (
                                            <Icon key={i} source={StarFilledIcon} tone="warning" />
                                        ))}
                                    </span>
                                </div>
                            )}

                            {/* Comment */}
                            <div style={{ whiteSpace: 'normal' }}>{comment}</div>

                            {/* Media */}
                            {media && media.length > 0 && (
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
                            )}

                            {/* Product Name */}
                            <Text variant="bodySm" tone="subdued" as="span">Product: {productName || 'Unknown Product'}</Text>
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge tone={status ? 'success' : 'critical'}>
                                    {status ? 'Published' : 'Hidden'}
                                </Badge>
                                <Button
                                    size="micro"
                                    onClick={() => handleToggleStatus({ id, customerName, rating, comment, createdAt, productName, media, status, shop, hideReason } as Review)}
                                    loading={updating === id}
                                >
                                    {status ? "Hide" : "Publish"}
                                </Button>
                            </div>
                            {!status && hideReason && (
                                <Text variant="bodySm" tone="critical" as="p">
                                    Reason: {hideReason}
                                </Text>
                            )}
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        {new Date(createdAt).toLocaleDateString()}
                    </IndexTable.Cell>
                </IndexTable.Row>
            );
        }
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Text variant="heading2xl" as="p">{stats.averageRating}</Text>
                                        <div style={{ transform: 'scale(2)', transformOrigin: 'left center' }}>
                                            <Icon source={StarFilledIcon} tone="warning" />
                                        </div>
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Breakdown</Text>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '13px' }}>
                                        <Badge tone="success">{`5★: ${stats.fiveStars}`}</Badge>
                                        <Badge tone="info">{`4★: ${stats.fourStars}`}</Badge>
                                        <Badge>{`3★: ${stats.threeStars}`}</Badge>
                                        <Badge tone="attention">{`2★: ${stats.twoStars}`}</Badge>
                                        <Badge tone="critical">{`1★: ${stats.oneStar}`}</Badge>
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                        </Grid>
                    </Layout.Section>
                )}

                <Layout.Section>
                    <Card padding="0">
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e1e3e5', display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <Select
                                    label="Filter by Product"
                                    options={products}
                                    value={productFilter}
                                    onChange={handleProductChange}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
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
                        </div>

                        <IndexTable
                            resourceName={resourceName}
                            itemCount={reviews.length}
                            selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: "Customer" },
                                { title: "Review Details" },
                                { title: "Status" },
                                { title: "Date" },
                            ]}
                            loading={loading}
                            emptyState={
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        Chưa có review nào. Reviews sẽ xuất hiện ở đây khi khách hàng đánh giá sản phẩm.
                                    </Text>
                                </div>
                            }
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

            <Modal
                open={isHideModalOpen}
                onClose={() => setIsHideModalOpen(false)}
                title="Reason for hiding review"
                primaryAction={{
                    content: 'Hide Review',
                    onAction: handleHideConfirm,
                    loading: updating === currentReview?.id
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setIsHideModalOpen(false),
                    },
                ]}
            >
                <Modal.Section>
                    <Select
                        label="Select a reason"
                        options={hideReasons}
                        value={selectedHideReason}
                        onChange={(val: string) => setSelectedHideReason(val)}
                    />
                </Modal.Section>
            </Modal>
        </Page>
    );
}
